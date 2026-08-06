import React, { useState } from 'react';
import { Camera, AlertTriangle, CheckCircle2, ChevronRight, X, Zap, Wrench, AlertCircle, Plus } from 'lucide-react';
import { maintenanceApi } from '../services/api';
import { CurrentUser } from '../types';

interface ReportingProps {
  currentUser: CurrentUser;
}

export const Reporting: React.FC<ReportingProps> = ({ currentUser }) => {
  const [step, setStep] = useState<'category' | 'details' | 'form' | 'success'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [referenceId, setReferenceId] = useState('');
  const [responseTime, setResponseTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const issueCategories = [
    { 
      id: 'facility-malfunction', 
      label: 'Facility Malfunctions', 
      icon: '⚙️',
      description: 'Issues with gym equipment, pool facilities, etc.',
      color: 'from-[#E6B325]/20 to-[#D4A017]/10',
      borderColor: 'border-[#E6B325]/30',
      subcategories: [
        { id: 'gym-equipment', label: 'Gym Equipment (Treadmill, Weights, etc.)', emoji: '🏋️' },
        { id: 'pool-equipment', label: 'Pool Equipment & Facilities', emoji: '🏊' },
        { id: 'elevator', label: 'Elevator Malfunction', emoji: '📶' },
        { id: 'ac-heating', label: 'AC/Heating System', emoji: '❄️' },
      ]
    },
    { 
      id: 'common-area', 
      label: 'Common Area Issues', 
      icon: '🏢',
      description: 'Corridor lights, trash, cleanliness, etc.',
      color: 'from-[#F5D547]/20 to-[#E6B325]/10',
      borderColor: 'border-[#F5D547]/30',
      subcategories: [
        { id: 'lighting', label: 'Corridor/Common Area Lights', emoji: '💡' },
        { id: 'trash', label: 'Trash Accumulation', emoji: '🗑️' },
        { id: 'cleanliness', label: 'Cleanliness Issue', emoji: '🧹' },
        { id: 'parking', label: 'Parking Area Damage', emoji: '🅿️' },
      ]
    },
    { 
      id: 'service-problem', 
      label: 'Service Problems', 
      icon: '📞',
      description: 'Unresponded requests, service delays, etc.',
      color: 'from-[#D4A017]/20 to-[#E6B325]/10',
      borderColor: 'border-[#D4A017]/30',
      subcategories: [
        { id: 'mgmt-unreachable', label: 'Property Management Unreachable', emoji: '📱' },
        { id: 'repair-unresolved', label: 'Repair Request Unresolved', emoji: '🔧' },
        { id: 'service-delay', label: 'Service Response Delay', emoji: '⏰' },
        { id: 'billing-issue', label: 'Billing/Payment Issue', emoji: '💳' },
      ]
    },
    { 
      id: 'other', 
      label: 'Other Issues', 
      icon: '💬',
      description: 'Custom issue with detailed description',
      color: 'from-[#B0B0B8]/20 to-[#4A4860]/10',
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
    const selectedCategoryObj = issueCategories.find(c => c.id === selectedCategory);
    const selectedSubObj = selectedCategoryObj?.subcategories.find(s => s.id === selectedSubcategory);

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const [task] = await maintenanceApi.create({
        id: crypto.randomUUID(),
        category: selectedCategory,
        subcategory: selectedSubcategory,
        title: `${selectedCategoryObj?.label}: ${selectedSubObj?.label || 'Custom'}`,
        description,
        location: 'Common Area',
        priority: selectedCategory === 'facility-malfunction' ? 'high' : 'medium',
        images: uploadedImages,
        resident_unit: currentUser.unit,
        user_id: currentUser.id,
      });

      setReferenceId(task.id);
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55]">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#E6B325]/5 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E6B325]/5 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-md w-full bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] p-8 rounded-3xl shadow-2xl border border-[#4A4860]/50 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-[#E6B325] to-[#D4A017] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#E6B325]/30 animate-bounce">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-3">Report Submitted</h3>
          <p className="text-[#B0B0B8] mb-2 leading-relaxed">
            Your issue has been received and assigned to our maintenance team.
          </p>
          
          <div className="bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl p-4 mb-6 mt-6 space-y-2">
            <div className="font-mono text-lg font-bold text-[#E6B325]">
              Ticket: {referenceId}
            </div>
            <div className="flex items-center justify-center gap-2 text-[#B0B0B8] text-sm">
              <Zap size={16} className="text-[#F5D547]" />
              Expected response: <span className="font-bold text-white">{responseTime}</span>
            </div>
          </div>

          <p className="text-xs text-[#B0B0B8] mb-8">Save your ticket number for tracking status</p>
          <button 
            onClick={resetForm}
            className="w-full bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-[#E6B325]/30 flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#E6B325]/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E6B325]/5 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-2xl mx-auto">
        
        {/* STEP 1: CATEGORY SELECTION - OPTIMIZED */}
        {step === 'category' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E6B325] to-[#D4A017] rounded-2xl flex items-center justify-center shadow-lg shadow-[#E6B325]/30">
                  <AlertTriangle size={24} className="text-white" />
                </div>
                Report an Issue
              </h2>
              <p className="text-[#B0B0B8] text-lg">Select the type of issue you're experiencing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issueCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`bg-gradient-to-br ${category.color} border ${category.borderColor} hover:shadow-lg hover:shadow-[#E6B325]/20 rounded-3xl p-6 text-left transition-all duration-300 group cursor-pointer backdrop-blur-sm`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{category.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-[#E6B325] transition-colors mb-1">{category.label}</h3>
                      <p className="text-sm text-[#B0B0B8] group-hover:text-[#B0B0B8]/80 transition-colors">{category.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-[#B0B0B8] group-hover:text-[#E6B325] transition-colors mt-1 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SUBCATEGORY SELECTION */}
        {step === 'details' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <button
                onClick={() => setStep('category')}
                className="text-[#B0B0B8] hover:text-white transition-colors mb-4 flex items-center gap-2 font-semibold"
              >
                ← Back to Categories
              </button>
              <h2 className="text-4xl font-bold text-white mb-2">Select Specific Issue</h2>
              <p className="text-[#B0B0B8]">Choose the specific subcategory that matches your issue</p>
            </div>

            <div className="bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] border border-[#4A4860]/50 rounded-3xl p-8 space-y-3 mb-8">
              {issueCategories
                .find(c => c.id === selectedCategory)
                ?.subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubcategorySelect(sub.id)}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl transition-all border bg-[#3D3B65]/20 border-[#4A4860]/50 hover:border-[#E6B325]/50 hover:bg-[#E6B325]/10 text-white hover:text-[#E6B325] group"
                  >
                    <div className="text-3xl flex-shrink-0">{sub.emoji}</div>
                    <div className="flex-1 text-left">
                      <p className="font-bold group-hover:text-[#E6B325] transition-colors">{sub.label}</p>
                    </div>
                    <ChevronRight size={20} className="text-[#B0B0B8] group-hover:text-[#E6B325] transition-colors flex-shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* STEP 3: DETAILED REPORT FORM */}
        {step === 'form' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <button
                onClick={() => setStep('details')}
                className="text-[#B0B0B8] hover:text-white transition-colors mb-4 flex items-center gap-2 font-semibold"
              >
                ← Back to Issue Type
              </button>
              <h2 className="text-4xl font-bold text-white mb-2">Provide Details</h2>
              <p className="text-[#B0B0B8]">Help us understand the issue better. Photos required for faster resolution.</p>
            </div>

            <div className="bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] border border-[#4A4860]/50 rounded-3xl p-8 space-y-8">
              
              {/* Character Count Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#B0B0B8] uppercase tracking-widest">Description</label>
                  <span className={`text-xs font-bold ${description.length > 200 ? 'text-[#E6B325]' : 'text-[#B0B0B8]'}`}>
                    {description.length}/200 characters
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  rows={4}
                  placeholder="Describe the issue in detail. Include any observations that might help our team..."
                  className="w-full px-6 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-white placeholder-[#B0B0B8]/60 focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors resize-none"
                />
              </div>

              {/* Image Upload - REQUIRED */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-[#B0B0B8] uppercase tracking-widest">Add Photos</label>
                  <div className="px-2 py-1 bg-[#E6B325]/20 border border-[#E6B325]/50 rounded text-xs font-bold text-[#E6B325] flex items-center gap-1">
                    <AlertCircle size={12} /> Required
                  </div>
                </div>
                <div className="relative border-2 border-dashed border-[#E6B325]/40 hover:border-[#E6B325]/70 rounded-3xl p-8 text-center transition-all cursor-pointer bg-[#E6B325]/5 hover:bg-[#E6B325]/10 group">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-3xl"
                  />
                  <div className="relative pointer-events-none">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#E6B325]/30 to-[#D4A017]/20 group-hover:from-[#E6B325]/40 group-hover:to-[#D4A017]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                      <Camera size={32} className="text-[#E6B325] group-hover:text-[#F5D547]" />
                    </div>
                    <p className="text-white font-bold mb-1">Tap to upload photos or videos</p>
                    <p className="text-xs text-[#B0B0B8]">JPG, PNG, MP4 up to 10MB each • Min 1 photo required</p>
                  </div>
                </div>
                <p className="text-xs text-[#B0B0B8] flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#E6B325]" />
                  Clear photos help us respond faster and more accurately
                </p>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-[#B0B0B8] uppercase tracking-widest">Attached Media ({uploadedImages.length})</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((image, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={image}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-28 object-cover rounded-2xl border border-[#E6B325]/30 hover:border-[#E6B325]/70 transition-all shadow-lg shadow-[#E6B325]/10"
                        />
                        <button
                          onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 w-7 h-7 bg-[#E6B325]/90 hover:bg-[#D4A017] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="border-l-4 p-4 rounded-lg" style={{backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#EF4444', color: '#FCA5A5'}}>
                  <p className="text-sm font-medium">{submitError}</p>
                </div>
              )}

              {/* Submit Button - Disabled if no images */}
              <button
                onClick={handleSubmit}
                disabled={uploadedImages.length === 0 || !description.trim() || isSubmitting}
                className={`w-full font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  uploadedImages.length > 0 && description.trim() && !isSubmitting
                    ? 'bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-white shadow-lg shadow-[#E6B325]/30 cursor-pointer'
                    : 'bg-[#3D3B65]/50 text-[#B0B0B8] cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={20} />
                {isSubmitting ? 'Submitting...' : uploadedImages.length === 0 ? 'Add photos to submit' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};