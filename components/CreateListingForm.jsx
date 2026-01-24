import { createClient } from '@/lib/supabase/client';
import { COUNTIES } from '@/data/locations';
import { AMENITIES } from '@/data/amenities';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
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
  MdEuro,
  MdUpload,
  MdKeyboardArrowDown,
  MdWarning
} from 'react-icons/md';
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
  { value: 'studio', label: 'Studio', icon: MdPhoto }, 
  { value: 'apartment', label: 'Apartment', icon: MdLocationOn }, 
  { value: 'house', label: 'House', icon: MdHome },
];

const STEPS = [
  { id: 1, title: 'Property Type', icon: MdHome },
  { id: 2, title: 'Details', icon: MdOutlineBed },
  { id: 3, title: 'Location', icon: MdLocationOn },
  { id: 4, title: 'Photos', icon: MdPhoto },
  { id: 5, title: 'Review', icon: MdCheck },
];

export default function CreateListingForm({ onClose, initialData = null }) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(initialData ? STEPS.length : 1);
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  
  const isEditing = !!initialData;

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        photos: initialData.property_media?.map(m => m.url) || [],
        videos: [], 
      };
    }
    return {
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
      photos: [], 
      videos: [], 
    };
  });

  useEffect(() => {
    // Check if user has complete profile (Lifestyle & Preferences)
    const checkProfile = async () => {
       if (!user) return;
       const supabase = createClient();
       const { data: lifestyle } = await supabase.from('user_lifestyles').select('user_id').eq('user_id', user.id).single();
       const { data: prefs } = await supabase.from('match_preferences').select('user_id').eq('user_id', user.id).single();
       
       if (!lifestyle || !prefs) {
          setProfileIncomplete(true);
       }
    };
    checkProfile();
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ... (Rest of existing handlers: handleFileChange, removeFile, toggleAmenity, handleNext, etc)
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
    if (currentStep === 1 && !formData.property_type) {
      toast.error('Please select a property type');
      return;
    }
    if (currentStep === 2) {
      if (!formData.title || !formData.price_per_month || !formData.description || 
          formData.bedrooms === '' || formData.bedrooms === null || 
          formData.bathrooms === '' || formData.bathrooms === null || 
          !formData.available_from) {
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
    setCurrentStep(prev => {
      const nextStep = Math.min(prev + 1, STEPS.length);
      setFurthestStep(f => Math.max(f, nextStep));
      return nextStep;
    });
  };

  const handleStepClick = (stepId) => {
    if (stepId <= furthestStep) {
      setCurrentStep(stepId);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const photoCount = formData.photos.length;
    if (photoCount < 1) {
      toast.error('At least one photo is required');
      return;
    }
    if (photoCount > 10) {
      toast.error('Maximum 10 photos allowed');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const body = new FormData();
        body.append('title', formData.title);
        body.append('description', formData.description);
        body.append('property_type', formData.property_type);
        body.append('price_per_month', formData.price_per_month);
        body.append('state', formData.state);
        body.append('city', formData.city);
        body.append('street', formData.street);
        body.append('bedrooms', formData.bedrooms);
        body.append('bathrooms', formData.bathrooms);
        body.append('square_meters', formData.square_meters);
        body.append('available_from', formData.available_from);
        body.append('amenities', JSON.stringify(formData.amenities));

        formData.photos.forEach(photo => {
          if (typeof photo === 'string') {
            body.append('existing_photos[]', photo);
          } else if (photo instanceof File) {
            body.append('new_photos[]', photo);
          }
        });

        formData.videos.forEach(video => {
           if (video instanceof File) body.append('new_videos[]', video);
        });

         const response = await fetch(`/api/properties/${initialData.id}`, {
           method: 'PUT',
           body: body,
         });

         if (!response.ok) throw new Error('Failed to update property details');
         
      } else {
        const body = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (key === 'photos' || key === 'videos') {
            value.forEach((file, idx) => {
              if (file instanceof File) {
                 body.append(`${key}[]`, file);
              }
            });
          } else if (Array.isArray(value)) {
            body.append(key, JSON.stringify(value));
          } else {
            body.append(key, value);
          }
        });
        
        const res = await fetch('/api/properties/create', {
          method: 'POST',
          body,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to create listing');
        }
      }

      toast.success(isEditing ? 'Property updated successfully!' : 'Listing created successfully!');
      if (onClose) onClose();
      router.refresh();
      router.push(isEditing ? '/my-properties' : '/dashboard');
    } catch (error) {
      console.error('[CreateListingForm] Submission error', error);
      toast.error(error.message || (isEditing ? 'Failed to update property' : 'Failed to create listing'));
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Listing' : 'List Your Property'}
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Progress Steps */}
          <Stepper 
            steps={STEPS} 
            currentStep={currentStep} 
            furthestStep={furthestStep}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
          {/* Profile Warning */}
          {profileIncomplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3 animate-fadeIn">
               <MdWarning className="text-amber-500 text-xl shrink-0 mt-0.5" />
               <div>
                 <h3 className="font-bold text-amber-900 text-sm">Improve your matches</h3>
                 <p className="text-amber-700 text-sm mt-1">
                   It looks like your profile is incomplete. We use your lifestyle and roommate preferences to match you with the best tenants.
                 </p>
                 <button 
                   onClick={() => window.open('/profile', '_blank')}
                   className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-900 underline"
                 >
                   Complete Profile Now &rarr;
                 </button>
               </div>
            </div>
          )}

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
