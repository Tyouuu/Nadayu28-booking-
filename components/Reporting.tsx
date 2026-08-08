'use client';

import React, { useState } from 'react';
import { Camera, AlertTriangle, CheckCircle2, ChevronRight, X, Zap, Wrench, AlertCircle, Plus } from 'lucide-react';
import { createReport } from '../services/dataService';
import { reportingSchema, validate } from '../services/validation';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';

export const Reporting: React.FC = () => {
  const [step, setStep] = useState<'category' | 'details' | 'form' | 'success'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [referenceId, setReferenceId] = useState('');
  const [responseTime, setResponseTime] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { t } = useI18n();
  const { userProfile } = useAuth();

  const issueCategories = [
    { 
      id: 'facility-malfunction', 
      label: t.reporting.facilityMalfunctions,
      icon: '⚙️',
      description: 'Issues with gym equipment, pool facilities, etc.',
      color: 'from-nadayu-accent/20 to-nadayu-accent/10',
      borderColor: 'border-nadayu-accent/30',
      subcategories: [
        { id: 'gym-equipment', label: 'Gym Equipment (Treadmill, Weights, etc.)', emoji: '🏋️' },
        { id: 'pool-equipment', label: 'Pool Equipment & Facilities', emoji: '🏊' },
        { id: 'elevator', label: 'Elevator Malfunction', emoji: '📶' },
        { id: 'ac-heating', label: 'AC/Heating System', emoji: '❄️' },
      ]
    },
    { 
      id: 'common-area', 
      label: t.reporting.commonAreaIssues,
      icon: '🏢',
      description: 'Corridor lights, trash, cleanliness, etc.',
      color: 'from-nadayu-accent/20 to-nadayu-accent/10',
      borderColor: 'border-nadayu-accent/30',
      subcategories: [
        { id: 'lighting', label: 'Corridor/Common Area Lights', emoji: '💡' },
        { id: 'trash', label: 'Trash Accumulation', emoji: '🗑️' },
        { id: 'cleanliness', label: 'Cleanliness Issue', emoji: '🧹' },
        { id: 'parking', label: 'Parking Area Damage', emoji: '🅿️' },
      ]
    },
    { 
      id: 'service-problem', 
      label: t.reporting.serviceProblems,
      icon: '📞',
      description: 'Unresponded requests, service delays, etc.',
      color: 'from-nadayu-accent/20 to-nadayu-accent/10',
      borderColor: 'border-nadayu-accent/30',
      subcategories: [
        { id: 'mgmt-unreachable', label: 'Property Management Unreachable', emoji: '📱' },
        { id: 'repair-unresolved', label: 'Repair Request Unresolved', emoji: '🔧' },
        { id: 'service-delay', label: 'Service Response Delay', emoji: '⏰' },
        { id: 'billing-issue', label: 'Billing/Payment Issue', emoji: '💳' },
      ]
    },
    { 
      id: 'other', 
      label: t.reporting.otherIssues,
      icon: '💬',
      description: 'Custom issue with detailed description',
      color: 'from-[#B0B0B8]/20 to-[#333]/10',
      borderColor: 'border-[#B0B0B8]/30',
      subcategories: [
        { id: 'other-custom', label: 'Custom Issue (Describe Below)', emoji: '✏️' },
      ]
    }
  ];

  const getExpectedResponseTime = (categoryId: string): string => {
    const times: { [key: string]: string } = {
      'facility-malfunction': '4-6 hours',
      'common-area': '6-12 hours',
      'service-problem': '2-4 hours',
      'other': '12-24 hours'
    };
    return times[categoryId] || '12-24 hours';
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setDescription('');
    setUploadedImages([]);
    setResponseTime(getExpectedResponseTime(categoryId));
    setStep('details');
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setStep('form');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    setSubmitError(null);
    const result = validate(reportingSchema, {
      category: selectedCategory, subcategory: selectedSubcategory, description,
    });
    if (!result.success) { setFieldErrors(result.errors); return; }

    const selectedCategoryObj = issueCategories.find(c => c.id === selectedCategory);
    const selectedSubObj = selectedCategoryObj?.subcategories.find(s => s.id === selectedSubcategory);

    setIsSubmitting(true);
    try {
      const id = await createReport({
        category: `${selectedCategoryObj?.label}: ${selectedSubObj?.label || 'Custom'}`,
        description,
        residentUnit: userProfile?.unit ?? '',
        images: uploadedImages,
      });
      setReferenceId(id);
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('category');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setDescription('');
    setUploadedImages([]);
  };

  // SUCCESS SCREEN
  if (step === 'success') {
    const selectedCat = issueCategories.find(c => c.id === selectedCategory);
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-nadayu-bg">
        <div className="absolute top-0 left-0 w-96 h-96 bg-nadayu-accent/5 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-nadayu-accent/5 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-lg border border-nadayu-border text-center">
          <div className="w-20 h-20 bg-nadayu-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-nadayu-success/30 animate-bounce">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">{t.reporting.reportSubmitted}</h3>
          <p className="text-gray-500 mb-2 leading-relaxed">
            Your issue has been received and assigned to our maintenance team.
          </p>
          
          <div className="bg-nadayu-cream border border-nadayu-border rounded-2xl p-4 mb-6 mt-6 space-y-2">
            <div className="font-mono text-lg font-bold text-nadayu-accent">
              {t.reporting.referenceId}: {referenceId}
            </div>
            <div className="flex items-center justify-center gap-2 text-nadayu-muted text-sm">
              <Zap size={16} className="text-nadayu-accent" />
              {t.reporting.expectedResponse}: <span className="font-bold text-gray-900">{responseTime}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-5">Save your ticket number for tracking status</p>
          <button 
            onClick={resetForm}
            className="w-full bg-nadayu-accent hover:brightness-95 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> {t.reporting.submitAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nadayu-bg p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-nadayu-accent/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-nadayu-accent/5 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-2xl mx-auto">
        
        {/* STEP 1: CATEGORY SELECTION - OPTIMIZED */}
        {step === 'category' && (
          <div className="">
            {/* Dark Header Banner */}
            <div className="bg-nadayu-panel rounded-3xl p-8 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">{t.reporting.title}</h2>
                <p className="text-nadayu-muted text-base">{t.reporting.subtitle}</p>
              </div>
              <div className="w-16 h-16 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={32} className="text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issueCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="bg-white border border-nadayu-border hover:border-nadayu-panel hover:shadow-md rounded-2xl p-6 text-left transition-all duration-300 group cursor-pointer shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-nadayu-panel rounded-xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:bg-nadayu-accent transition-colors">
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{category.label}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-nadayu-panel transition-colors mt-1 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SUBCATEGORY SELECTION */}
        {step === 'details' && (
          <div className="">
            <div className="mb-5">
              <button
                onClick={() => setStep('category')}
                className="text-gray-500 hover:text-gray-900 transition-colors mb-4 flex items-center gap-2 font-semibold"
              >
                ← Back to Categories
              </button>
              <div className="bg-nadayu-panel rounded-3xl p-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{t.reporting.selectCategory}</h2>
                  <p className="text-nadayu-muted">{t.reporting.subtitle}</p>
                </div>
                <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ChevronRight size={28} className="text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-nadayu-border rounded-2xl p-6 space-y-3 mb-5 shadow-sm">
              {issueCategories
                .find(c => c.id === selectedCategory)
                ?.subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubcategorySelect(sub.id)}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl transition-all border bg-white border-nadayu-border hover:border-nadayu-panel hover:bg-nadayu-panel hover:text-white text-gray-800 group"
                  >
                    <div className="text-3xl flex-shrink-0">{sub.emoji}</div>
                    <div className="flex-1 text-left">
                      <p className="font-bold group-hover:text-white transition-colors">{sub.label}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-nadayu-accent transition-colors flex-shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* STEP 3: DETAILED REPORT FORM */}
        {step === 'form' && (
          <div className="">
            <div className="mb-5">
              <button
                onClick={() => setStep('details')}
                className="text-gray-500 hover:text-gray-900 transition-colors mb-4 flex items-center gap-2 font-semibold"
              >
                ← Back to Issue Type
              </button>
              <div className="bg-nadayu-panel rounded-3xl p-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Provide Details</h2>
                  <p className="text-nadayu-muted">Help us understand the issue better. Photos required for faster resolution.</p>
                </div>
                <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Camera size={28} className="text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-nadayu-border rounded-2xl p-6 space-y-5 shadow-sm">
              
              {/* Character Count Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-nadayu-muted uppercase tracking-widest">{t.reporting.description}</label>
                  <span className={`text-xs font-bold ${description.length > 200 ? 'text-red-500' : 'text-nadayu-muted'}`}>
                    {description.length}/200 characters
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value.slice(0, 200)); setFieldErrors(prev => ({ ...prev, description: '' })); }}
                  rows={4}
                  placeholder="Describe the issue in detail. Include any observations that might help our team..."
                  className={`w-full px-6 py-4 bg-nadayu-cream border rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium transition-colors resize-none ${fieldErrors.description ? 'border-red-400' : 'border-nadayu-border'}`}
                />
                {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
              </div>

              {/* Image Upload - REQUIRED */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-nadayu-muted uppercase tracking-widest">{t.reporting.addPhotos}</label>
                  <div className="px-2 py-1 bg-nadayu-cream border border-nadayu-border rounded text-xs font-bold text-gray-600 flex items-center gap-1">
                    <AlertCircle size={12} /> Required
                  </div>
                </div>
                <div className="relative border-2 border-dashed border-nadayu-border hover:border-nadayu-panel rounded-2xl p-6 text-center transition-all cursor-pointer bg-nadayu-cream hover:bg-nadayu-cream group">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-2xl"
                  />
                  <div className="relative pointer-events-none">
                    <div className="w-16 h-16 bg-nadayu-panel group-hover:bg-nadayu-accent rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                      <Camera size={32} className="text-white" />
                    </div>
                    <p className="text-gray-900 font-bold mb-1">Tap to upload photos or videos</p>
                    <p className="text-xs text-gray-500">JPG, PNG, MP4 up to 10MB each • Min 1 photo required</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-nadayu-muted" />
                  Clear photos help us respond faster and more accurately
                </p>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-nadayu-muted uppercase tracking-widest">Attached Media ({uploadedImages.length})</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((image, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={image}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-28 object-cover rounded-2xl border border-nadayu-border hover:border-nadayu-panel transition-all shadow-sm"
                        />
                        <button
                          onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="border-l-4 p-4 rounded-lg" style={{backgroundColor: '#fef2f2', borderColor: '#ef4444', color: '#991b1b'}}>
                  <p className="text-sm font-medium">{submitError}</p>
                </div>
              )}

              {/* Submit Button - Disabled if no images */}
              <button
                onClick={handleSubmit}
                disabled={uploadedImages.length === 0 || !description.trim() || isSubmitting}
                className={`w-full font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  uploadedImages.length > 0 && description.trim() && !isSubmitting
                    ? 'bg-nadayu-panel hover:brightness-110 text-white shadow-sm cursor-pointer'
                    : 'bg-nadayu-cream text-nadayu-muted cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={20} />
                {isSubmitting ? 'Submitting...' : uploadedImages.length === 0 ? t.reporting.addPhotos : t.reporting.submitReport}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};