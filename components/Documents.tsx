import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, FolderOpen } from 'lucide-react';
import { fetchDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl, Document } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const CATEGORIES = ['Meeting Minutes', 'House Rules', 'Financial Reports', 'Other'] as const;

export const Documents: React.FC = () => {
  const { currentUserRole } = useAuth();
  const isManagement = currentUserRole === UserRole.MANAGEMENT;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | typeof CATEGORIES[number]>('all');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Meeting Minutes');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    fetchDocuments(categoryFilter === 'all' ? undefined : categoryFilter).then(setDocuments).catch(() => {});
  };
  useEffect(() => { load(); }, [categoryFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!title.trim() || !file) {
      setUploadError('Title and file are required.');
      return;
    }
    setIsUploading(true);
    try {
      await uploadDocument({ title: title.trim(), category, file });
      setTitle('');
      setFile(null);
      load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    const url = await getDocumentDownloadUrl(doc.filePath);
    window.open(url, '_blank');
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      load();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-nadayu-panel rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
          <FolderOpen size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Documents</h2>
          <p className="mt-1 text-sm text-nadayu-muted">Meeting minutes, house rules, and other community documents.</p>
        </div>
      </div>

      {isManagement && (
        <div className="bg-white border border-nadayu-border rounded-2xl p-6 mb-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload size={18} /> Upload Document
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AGM Minutes - March 2026"
                  className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                  className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">File</label>
              <input type="file" accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-nadayu-panel file:text-white hover:file:bg-[#222222]" />
            </div>
            {uploadError && <p className="text-sm text-red-500 px-4 py-2 rounded-xl bg-red-50">{uploadError}</p>}
            <button type="submit" disabled={isUploading}
              className="px-6 py-3 rounded-xl font-bold text-white bg-nadayu-panel hover:brightness-110 transition-all disabled:opacity-50">
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['all', ...CATEGORIES] as const).map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
              categoryFilter === c ? 'bg-nadayu-panel text-white' : 'bg-nadayu-cream text-gray-500 hover:bg-gray-200'
            }`}>
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden divide-y divide-gray-50">
        {documents.length === 0 && (
          <p className="text-sm text-nadayu-muted text-center py-12">No documents in this category.</p>
        )}
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-nadayu-cream/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-nadayu-cream rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-nadayu-muted" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{doc.title}</p>
                <p className="text-xs text-nadayu-muted mt-0.5">{doc.category} · {doc.uploadedByName} · {new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDownload(doc)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-nadayu-panel px-3 py-2 rounded-lg bg-nadayu-cream hover:bg-nadayu-cream transition-colors">
                <Download size={14} /> Download
              </button>
              {isManagement && (
                <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id}
                  className="p-2 rounded-lg text-nadayu-muted hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
