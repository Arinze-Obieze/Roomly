'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  MdHome, 
  MdLocationOn, 
  MdPhoto, 
  MdCheck,
  MdArrowBack,
  MdArrowForward,
  MdClose,
  MdCheckCircle,
  MdOutlineBed,
  MdBathtub,
  MdSquareFoot,
  MdCalendarToday,
  MdEuro
} from 'react-icons/md';
import { 
  FaWifi, 
  FaPaw, 
  FaCar, 
  FaDumbbell, 
  FaTv, 
  FaSnowflake,
  FaFire,
  FaTree,
  FaWheelchair,
  FaSmokingBan,
  FaDoorOpen,
  FaCouch
} from 'react-icons/fa';
import InputField from './Forms/InputField';
import SubmitButton from './Forms/SubmitButton';
import Stepper from './Forms/Stepper';
import DetailsForm from './Forms/DetailsForm';
import LocationForm from './Forms/LocationForm';
import MediaUpload from './Forms/MediaUpload';
import ReviewCard from './Forms/ReviewCard';
import FooterNav from './Forms/FooterNav';

const PROPERTY_TYPES = [
  { value: 'room', label: 'Private Room', icon: MdOutlineBed },
  { value: 'studio', label: 'Studio', icon: MdPhoto }, // Studio: photo icon for distinction
  { value: 'apartment', label: 'Apartment', icon: MdLocationOn }, // Apartment: location icon
  { value: 'house', label: 'House', icon: MdHome },
];

export const AMENITIES = [
  { value: 'wifi', label: 'WiFi', icon: FaWifi },
  { value: 'parking', label: 'Parking', icon: FaCar },
  { value: 'pets', label: 'Pets Allowed', icon: FaPaw },
  { value: 'gym', label: 'Gym', icon: FaDumbbell },
  { value: 'tv', label: 'TV', icon: FaTv },
  { value: 'ac', label: 'Air Con', icon: FaSnowflake },
  { value: 'heating', label: 'Heating', icon: FaFire },
  { value: 'garden', label: 'Garden', icon: FaTree },
  { value: 'wheelchair', label: 'Accessible', icon: FaWheelchair },
  { value: 'smoking', label: 'No Smoking', icon: FaSmokingBan },
  { value: 'private_entrance', label: 'Private Entry', icon: FaDoorOpen },
  { value: 'furnished', label: 'Furnished', icon: FaCouch },
];

const STEPS = [
  { id: 1, title: 'Property Type', icon: MdHome },
  { id: 2, title: 'Details', icon: MdOutlineBed },
  { id: 3, title: 'Location', icon: MdLocationOn },
  { id: 4, title: 'Photos', icon: MdPhoto },
  { id: 5, title: 'Review', icon: MdCheck },
];

export default function CreateListingForm({ onClose }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: '',
    price_per_month: '',
    state: '',
    city: '',
    street: '',
    bedrooms: 1,
    bathrooms: 1,
    square_meters: '',
    available_from: '',
    amenities: [],
    photos: [], // Array of File
    videos: [], // Array of File
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle file input for photos/videos
  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    setFormData(prev => {
      const current = prev[type] || [];
      let max = type === 'photos' ? 10 : 5;
      let filtered = files.filter(f => {
        if (type === 'photos') return f.type.startsWith('image/');
        if (type === 'videos') return f.type.startsWith('video/');
        return false;
      });
      // Limit total
      let newFiles = [...current, ...filtered].slice(0, max);
      return { ...prev, [type]: newFiles };
    });
  };

  const removeFile = (type, idx) => {
    setFormData(prev => {
      const arr = [...prev[type]];
      arr.splice(idx, 1);
      return { ...prev, [type]: arr };
    });
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && !formData.property_type) {
      toast.error('Please select a property type');
      return;
    }
    if (currentStep === 2) {
      if (!formData.title || !formData.price_per_month || !formData.description || !formData.bedrooms || !formData.bathrooms || !formData.square_meters || !formData.available_from) {
        toast.error('Please fill in all required details');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.state || !formData.city || !formData.street) {
        toast.error('Please enter state, city, and street');
        return;
      }
    }
    if (currentStep === 4) {
      if (formData.photos.length < 1) {
        toast.error('At least one photo is required');
        return;
      }
      if (formData.photos.length > 10) {
        toast.error('Maximum 10 photos allowed');
        return;
      }
      if (formData.videos.length > 5) {
        toast.error('Maximum 5 videos allowed');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Final validation
    console.log('[CreateListingForm] handleSubmit called', { formData });
    if (formData.photos.length < 1) {
      toast.error('At least one photo is required');
      console.log('[CreateListingForm] Validation failed: No photos');
      return;
    }
    if (formData.photos.length > 10) {
      toast.error('Maximum 10 photos allowed');
      console.log('[CreateListingForm] Validation failed: Too many photos');
      return;
    }
    if (formData.videos.length > 5) {
      toast.error('Maximum 5 videos allowed');
      console.log('[CreateListingForm] Validation failed: Too many videos');
      return;
    }
    setIsSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'photos' || key === 'videos') {
          value.forEach((file, idx) => {
            body.append(`${key}[]`, file);
          });
        } else if (Array.isArray(value)) {
          body.append(key, JSON.stringify(value));
        } else {
          body.append(key, value);
        }
      });
      console.log('[CreateListingForm] Submitting FormData to /api/properties');
      const res = await fetch('/api/properties', {
        method: 'POST',
        body,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log('[CreateListingForm] API error', data);
        throw new Error(data.error || 'Failed to create listing');
      }
      toast.success('Listing created successfully!');
      console.log('[CreateListingForm] Listing created successfully!');
      if (onClose) onClose();
      router.push('/dashboard');
    } catch (error) {
      console.error('[CreateListingForm] Submission error', error);
      toast.error(error.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
      console.log('[CreateListingForm] handleSubmit finished');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose || (() => router.back())}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MdClose size={24} className="text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">List Your Property</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Progress Steps */}
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
          {/* Step 1: Property Type */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  What type of property are you listing?
                </h2>
                <p className="text-slate-600">
                  Choose the option that best describes your space
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleChange('property_type', type.value)}
                    className={`p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] flex flex-col items-center justify-center ${
                      formData.property_type === type.value
                        ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center w-14 h-14 rounded-full mb-2" style={{ backgroundColor: formData.property_type === type.value ? '#e0f2fe' : '#f1f5f9' }}>
                      <type.icon
                        size={32}
                        className={
                          formData.property_type === type.value
                            ? 'text-cyan-600'
                            : 'text-slate-400'
                        }
                      />
                    </div>
                    <span className="font-bold text-base text-slate-900 text-center">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <DetailsForm
              formData={formData}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              handleChange={handleChange}
              toggleAmenity={toggleAmenity}
            />
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <LocationForm
              formData={formData}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              handleChange={handleChange}
            />
          )}

          {/* Step 4: Photos & Videos */}
          {currentStep === 4 && (
            <MediaUpload
              formData={formData}
              handleFileChange={handleFileChange}
              removeFile={removeFile}
            />
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <ReviewCard formData={formData} />
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <FooterNav
        currentStep={currentStep}
        STEPS={STEPS}
        handleBack={handleBack}
        handleNext={handleNext}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
