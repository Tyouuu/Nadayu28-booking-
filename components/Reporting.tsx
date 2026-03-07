import React, { useState } from 'react';
import { Camera, AlertTriangle, CheckCircle2, ChevronRight, X, Zap, Wrench, AlertCircle, Plus } from 'lucide-react';
import { taskManagementService } from '../services/taskManagementService';

export const Reporting: React.FC = () => {
  const [step, setStep] = useState<'category' | 'details' | 'form' | 'success'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [referenceId, setReferenceId] = useState('');
  const [responseTime, setResponseTime] = useState('');

  const issueCategories = [
    { 
      id: 'facility-malfunction', 
      label: 'Facility Malfunctions', 
      icon: '⚙️',
      description: 'Issues with gym equipment, pool facilities, etc.',
      color: 'from-[#C8FF00]/20 to-[#b0e000]/10',
      borderColor: 'border-[#C8FF00]/30',
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
      color: 'from-[#d4ff33]/20 to-[#C8FF00]/10',
      borderColor: 'border-[#d4ff33]/30',
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
      color: 'from-[#b0e000]/20 to-[#C8FF00]/10',
      borderColor: 'border-[#b0e000]/30',
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
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = () => {
    const selectedCategoryObj = issueCategories.find(c => c.id === selectedCategory);
    const selectedSubObj = selectedCategoryObj?.subcategories.find(s => s.id === selectedSubcategory);
    
    // Create task via service
    const task = taskManagementService.reportTask({
      type: 'maintenance',
      title: `${selectedCategoryObj?.label}: ${selectedSubObj?.label || 'Custom'}`,
      description: description,
      location: 'Common Area',
      priority: selectedCategory === 'facility-malfunction' ? 'high' : 'medium',
      reportedBy: 'Current User',
    });

    setReferenceId(task.id);
    setStep('success');
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#C8FF00]/5 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C8FF00]/5 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#C8FF00] to-[#b0e000] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#C8FF00]/30 animate-bounce">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Report Submitted</h3>
          <p className="text-gray-500 mb-2 leading-relaxed">
            Your issue has been received and assigned to our maintenance team.
          </p>
          
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 mt-6 space-y-2">
            <div className="font-mono text-lg font-bold text-[#C8FF00]">
              Ticket: {referenceId}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Zap size={16} className="text-[#C8FF00]" />
              Expected response: <span className="font-bold text-gray-900">{responseTime}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-5">Save your ticket number for tracking status</p>
          <button 
            onClick={resetForm}
            className="w-full bg-[#C8FF00] hover:brightness-95 text-[#111111] px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#C8FF00]/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C8FF00]/5 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-2xl mx-auto">
        
        {/* STEP 1: CATEGORY SELECTION - OPTIMIZED */}
        {step === 'category' && (
          <div className="">
            {/* Dark Header Banner */}
            <div className="bg-[#111111] rounded-3xl p-8 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Report an Issue</h2>
                <p className="text-gray-400 text-base">Select the type of issue you're experiencing</p>
              </div>
              <div className="w-16 h-16 bg-[#C8FF00] rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={32} className="text-[#111111]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issueCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="bg-white border border-gray-100 hover:border-[#111111] hover:shadow-md rounded-2xl p-6 text-left transition-all duration-300 group cursor-pointer shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#111111] rounded-xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:bg-[#C8FF00] transition-colors">
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{category.label}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-[#111111] transition-colors mt-1 flex-shrink-0" />
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
              <div className="bg-[#111111] rounded-3xl p-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Select Specific Issue</h2>
                  <p className="text-gray-400">Choose the specific subcategory that matches your issue</p>
                </div>
                <div className="w-14 h-14 bg-[#C8FF00] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ChevronRight size={28} className="text-[#111111]" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3 mb-5 shadow-sm">
              {issueCategories
                .find(c => c.id === selectedCategory)
                ?.subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubcategorySelect(sub.id)}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl transition-all border bg-white border-gray-100 hover:border-[#111111] hover:bg-[#111111] hover:text-white text-gray-800 group"
                  >
                    <div className="text-3xl flex-shrink-0">{sub.emoji}</div>
                    <div className="flex-1 text-left">
                      <p className="font-bold group-hover:text-white transition-colors">{sub.label}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-[#C8FF00] transition-colors flex-shrink-0" />
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
              <div className="bg-[#111111] rounded-3xl p-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Provide Details</h2>
                  <p className="text-gray-400">Help us understand the issue better. Photos required for faster resolution.</p>
                </div>
                <div className="w-14 h-14 bg-[#C8FF00] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Camera size={28} className="text-[#111111]" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
              
              {/* Character Count Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Description</label>
                  <span className={`text-xs font-bold ${description.length > 200 ? 'text-red-500' : 'text-gray-400'}`}>
                    {description.length}/200 characters
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  rows={4}
                  placeholder="Describe the issue in detail. Include any observations that might help our team..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none font-medium transition-colors resize-none"
                />
              </div>

              {/* Image Upload - REQUIRED */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Add Photos</label>
                  <div className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600 flex items-center gap-1">
                    <AlertCircle size={12} /> Required
                  </div>
                </div>
                <div className="relative border-2 border-dashed border-gray-200 hover:border-[#111111] rounded-2xl p-6 text-center transition-all cursor-pointer bg-gray-50 hover:bg-gray-100 group">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-2xl"
                  />
                  <div className="relative pointer-events-none">
                    <div className="w-16 h-16 bg-[#111111] group-hover:bg-[#C8FF00] rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                      <Camera size={32} className="text-white group-hover:text-[#111111]" />
                    </div>
                    <p className="text-gray-900 font-bold mb-1">Tap to upload photos or videos</p>
                    <p className="text-xs text-gray-500">JPG, PNG, MP4 up to 10MB each • Min 1 photo required</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-gray-400" />
                  Clear photos help us respond faster and more accurately
                </p>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Attached Media ({uploadedImages.length})</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((image, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={image}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-28 object-cover rounded-2xl border border-gray-200 hover:border-[#111111] transition-all shadow-sm"
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

              {/* Submit Button - Disabled if no images */}
              <button
                onClick={handleSubmit}
                disabled={uploadedImages.length === 0 || !description.trim()}
                className={`w-full font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  uploadedImages.length > 0 && description.trim()
                    ? 'bg-[#111111] hover:bg-[#222222] text-white shadow-sm cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={20} /> 
                {uploadedImages.length === 0 ? 'Add photos to submit' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};