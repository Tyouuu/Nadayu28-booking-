import React, { useEffect, useState } from 'react';
import { Package as PackageIcon, Truck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { fetchPackages, fetchAllPackages, logPackage, markPackageCollected, Package } from '../services/dataService';

export const Packages: React.FC = () => {
  const { currentUserRole, userProfile } = useAuth();
  const isStaff = currentUserRole === UserRole.SECURITY || currentUserRole === UserRole.MANAGEMENT;

  const [packages, setPackages] = useState<Package[]>([]);
  const [logUnit, setLogUnit] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [logCourier, setLogCourier] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = () => {
    if (isStaff) {
      fetchAllPackages().then(setPackages).catch(() => {});
    } else if (userProfile?.unit) {
      fetchPackages(userProfile.unit).then(setPackages).catch(() => {});
    }
  };
  useEffect(() => { load(); }, [isStaff, userProfile?.unit]);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logUnit.trim()) return;
    setIsLogging(true);
    try {
      await logPackage({ unit: logUnit.trim(), description: logDescription.trim(), courier: logCourier.trim() });
      setLogUnit('');
      setLogDescription('');
      setLogCourier('');
      load();
    } finally {
      setIsLogging(false);
    }
  };

  const handleMarkCollected = async (id: string) => {
    setMarkingId(id);
    try {
      await markPackageCollected(id);
      load();
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-nadayu-panel rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
          <PackageIcon size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Packages</h2>
          <p className="mt-1 text-sm text-nadayu-muted">
            {isStaff ? 'Log deliveries and track pickup at the lobby.' : `Deliveries for ${userProfile?.unit ?? 'your unit'}.`}
          </p>
        </div>
      </div>

      {isStaff && (
        <div className="bg-white border border-nadayu-border rounded-2xl p-6 mb-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={18} /> Log Package
          </h3>
          <form onSubmit={handleLog} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Unit *</label>
                <input type="text" value={logUnit} onChange={(e) => setLogUnit(e.target.value)}
                  placeholder="e.g. B-06-02"
                  className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Description</label>
                <input type="text" value={logDescription} onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="e.g. Amazon box"
                  className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Courier</label>
                <input type="text" value={logCourier} onChange={(e) => setLogCourier(e.target.value)}
                  placeholder="e.g. J&T"
                  className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
              </div>
            </div>
            <button type="submit" disabled={isLogging || !logUnit.trim()}
              className="px-6 py-3 rounded-xl font-bold text-white bg-nadayu-panel hover:brightness-110 transition-all disabled:opacity-50">
              {isLogging ? 'Logging...' : 'Log Package'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden divide-y divide-gray-50">
        {packages.length === 0 && (
          <p className="text-sm text-nadayu-muted text-center py-12">No packages yet.</p>
        )}
        {packages.map(pkg => (
          <div key={pkg.id} className="flex items-center justify-between px-6 py-4 hover:bg-nadayu-cream/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-nadayu-cream rounded-xl flex items-center justify-center flex-shrink-0">
                <PackageIcon size={18} className="text-nadayu-muted" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {isStaff && <span className="text-nadayu-accent">{pkg.unit}</span>}
                  {isStaff && pkg.description ? ' · ' : ''}
                  {pkg.description ?? (isStaff ? '' : 'Package')}
                </p>
                <p className="text-xs text-nadayu-muted mt-0.5">
                  {pkg.courier ? `${pkg.courier} · ` : ''}{pkg.receivedByName} · {new Date(pkg.receivedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                pkg.status === 'collected' ? 'bg-nadayu-success/15 text-nadayu-success' : 'bg-orange-50 text-orange-500'
              }`}>
                {pkg.status}
              </span>
              {isStaff && pkg.status === 'waiting' && (
                <button onClick={() => handleMarkCollected(pkg.id)} disabled={markingId === pkg.id}
                  className="flex items-center gap-1.5 text-xs font-bold text-nadayu-muted hover:text-nadayu-panel transition-colors disabled:opacity-50">
                  <CheckCircle2 size={14} /> Mark Collected
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
