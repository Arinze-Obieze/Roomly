'use client';

import { createClient } from '@/core/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { 
  MdHome, 
  MdLocationOn, 
  MdPhoto, 
  MdCheck,
  MdClose,
  MdWarning,
  MdPerson,
  MdAttachMoney,
  MdPool,
  MdFavorite,
  MdCalendarToday,
  MdBolt
} from 'react-icons/md';

import Stepper from '../forms/Stepper';
import FooterNav from '../forms/FooterNav';

// Sub-forms
import BasicsForm from '../forms/Listing/BasicsForm';
import PropertyForm from '../forms/Listing/PropertyForm';
import LocationForm from '../forms/Listing/LocationForm';
import FinancialsForm from '../forms/Listing/FinancialsForm';
import AmenitiesForm from '../forms/Listing/AmenitiesForm';
import PreferencesForm from '../forms/Listing/PreferencesForm';
import AvailabilityForm from '../forms/Listing/AvailabilityForm';
import MediaUpload from '../forms/MediaUpload';

const STEPS = [
  { id: 1, title: 'Basics', icon: MdPerson },
  { id: 2, title: 'Property', icon: MdHome },
  { id: 3, title: 'Location', icon: MdLocationOn },
  { id: 4, title: 'Media', icon: MdPhoto },
  { id: 5, title: 'Financials', icon: MdAttachMoney },
  { id: 6, title: 'Amenities', icon: MdPool },
  { id: 7, title: 'Preferences', icon: MdFavorite },
  { id: 8, title: 'Availability', icon: MdCalendarToday },
];

export default function CreateListingForm({ onClose, initialData = null }) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(initialData ? STEPS.length : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  
  const isEditing = !!initialData;

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        photos: initialData.property_media?.map(m => m.url) || [],
        videos: [], 
        lifestyle_priorities: initialData.lifestyle_priorities || {},
        deal_breakers: initialData.deal_breakers || [],
        amenities: initialData.amenities || [],
        transport_options: initialData.transport_options || [],
        payment_methods: initialData.payment_methods || [],
      };
    }
    return {
      // Basics
      role: '',
      rental_type: 'monthly',
      title: '',
      description: '',
      // Property
      property_category: 'apartment',
      offering_type: 'private_room',
      bedrooms: 1,
      bathrooms: 1,
      floor_area: '',
      year_built: '',
      ber_rating: '',
      // Location
      state: '',
      city: '',
      street: '',
      latitude: null,
      longitude: null,
      transport_options: [],
      is_gaeltacht: false,
      // Media
      photos: [],
      videos: [],
      // Financials
      price_per_month: '',
      deposit: '',
      bills_option: 'some',
      custom_bills: [],
      couples_allowed: false,
      payment_methods: [],
      // Amenities
      amenities: [],
      // Preferences
      occupation_preference: 'any',
      gender_preference: 'any',
      age_min: 18,
      age_max: 99,
      lifestyle_priorities: {},
      deal_breakers: [],
      partner_description: '',
      // Availability
      available_from: '',
      is_immediate: false,
      min_stay_months: 6,
      accept_viewings: true,
    };
  });

  useEffect(() => {
    const checkProfile = async () => {
       if (!user) return;
       const supabase = createClient();
       const { data: lifestyle } = await supabase.from('user_lifestyles').select('user_id').eq('user_id', user.id).single();
       if (!lifestyle) setProfileIncomplete(true);
    };
    checkProfile();
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const handleNext = () => {
    // Validation Logic
    if (currentStep === 1) { // Basics
        if (!formData.role || !formData.title || !formData.description) {
            toast.error('Please fill in all basic details');
            return;
        }
    }
    if (currentStep === 2) { // Property
        if (!formData.property_category || !formData.offering_type) {
             toast.error('Please select property and offering types');
             return;
        }
    }
    if (currentStep === 3) { // Location
        if (!formData.state || !formData.city || !formData.street) {
             toast.error('Please provide a full address');
             return;
        }
    }
    if (currentStep === 4) { // Media
        if (formData.photos.length === 0) {
             toast.error('At least 1 photo is required');
             return;
        }
    }
    if (currentStep === 5) { // Financials
        if (!formData.price_per_month || !formData.deposit) {
             toast.error('Please set rent and deposit');
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
    if (!formData.available_from) {
        toast.error('Please select an availability date');
        return;
    }

    setIsSubmitting(true);
    try {
        const payload = new FormData();
        
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'photos' || key === 'videos') return;
            
            if (key === 'available_from' && value === '') {
                return; 
            }

            if (typeof value === 'object' && value !== null) {
                payload.append(key, JSON.stringify(value));
            } else {
                payload.append(key, value);
            }
        });

        formData.photos.forEach(photo => {
             if (photo instanceof File) payload.append('new_photos[]', photo);
             else payload.append('existing_photos[]', photo);
        });
        formData.videos.forEach(video => {
             if (video instanceof File) payload.append('new_videos[]', video);
        });

        const url = isEditing ? `/api/properties/${initialData.id}` : '/api/properties/create';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, { method, body: payload });
        
        if (!res.ok) {
            const err = await res.json();
             throw new Error(err.error || 'Failed to save listing');
        }

        toast.success('Listing published successfully!');
        if(onClose) onClose();
        router.refresh();
        router.push('/dashboard');

    } catch (error) {
        console.error(error);
        toast.error(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-50 flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-navy-200">
        <div className="container max-w-5xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose || (() => router.back())}
              className="p-2 hover:bg-navy-50 rounded-xl transition-colors"
              aria-label="Close"
            >
              <MdClose size={24} className="text-navy-500" />
            </button>
            <h1 className="text-lg font-heading font-bold text-navy-950">
              {isEditing ? 'Edit Listing' : 'Create Your Listing'}
            </h1>
            <div className="w-10" />
          </div>

          <Stepper 
            steps={STEPS} 
            currentStep={currentStep} 
            furthestStep={furthestStep}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        <div className="container max-w-3xl mx-auto px-4 lg:px-8 py-8">
            <div className="mb-5 text-xs font-sans text-navy-500 bg-navy-50 border border-navy-200 rounded-xl px-3 py-2">
              Fields marked Required are needed to publish. Optional fields help your listing rank better and can be added anytime.
            </div>
            
            {profileIncomplete && (
                <div className="bg-terracotta-50 border border-terracotta-200 rounded-2xl p-4 mb-8 flex gap-3">
                    <MdWarning className="text-terracotta-500 shrink-0" size={24} />
                    <div>
                        <h3 className="font-heading font-bold text-navy-950">Complete your profile</h3>
                        <p className="text-sm text-navy-700 mt-1 font-sans">
                            Better profiles get 3x more inquiries. Add your lifestyle preferences properly.
                        </p>
                    </div>
                </div>
            )}

            {currentStep === 1 && <BasicsForm formData={formData} handleChange={handleChange} />}
            {currentStep === 2 && <PropertyForm formData={formData} handleChange={handleChange} />}
            {currentStep === 3 && <LocationForm formData={formData} handleChange={handleChange} />}
            {currentStep === 4 && <MediaUpload formData={formData} handleFileChange={handleFileChange} removeFile={removeFile} />}
            {currentStep === 5 && <FinancialsForm formData={formData} handleChange={handleChange} />}
            {currentStep === 6 && <AmenitiesForm formData={formData} handleChange={handleChange} />}
            {currentStep === 7 && <PreferencesForm formData={formData} handleChange={handleChange} />}
            {currentStep === 8 && <AvailabilityForm formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} removeFile={removeFile} />}

        </div>
      </div>

      {/* Footer */}
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
