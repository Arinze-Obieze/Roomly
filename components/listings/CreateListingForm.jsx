'use client';

import { createClient } from '@/core/utils/supabase/client';
import { fetchWithCsrf } from '@/core/utils/fetchWithCsrf';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
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
  MdBolt,
  MdChecklist
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

const createPhotoItem = ({ file = null, url = '', status = 'ready', originalName = '' }) => ({
  id: `${status}-${Math.random().toString(36).slice(2, 10)}`,
  file,
  url,
  status,
  originalName,
});

export default function CreateListingForm({ onClose, initialData = null }) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(initialData ? STEPS.length : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const photoUrlsRef = useRef([]);
  
  const isEditing = !!initialData;

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        role: initialData.listed_by_role || initialData.role || '',
        photos: initialData.property_media?.map(m => createPhotoItem({ url: m.url, status: 'ready' })) || [],
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
      is_public: true,
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

  useEffect(() => {
    photoUrlsRef.current = (formData.photos || [])
      .map((photo) => photo?.url)
      .filter((url) => typeof url === 'string' && url.startsWith('blob:'));
  }, [formData.photos]);

  useEffect(() => {
    return () => {
      photoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (step = currentStep) => {
    const errors = {};

    if (step === 1) {
      if (!formData.role) errors.role = 'Select who is listing this property.';
      if (!formData.title?.trim()) errors.title = 'Add a listing title.';
      if (!formData.description?.trim()) errors.description = 'Add a short description of the property.';
      if (formData.rental_type === 'fixed' && !formData.fixed_term_duration) {
        errors.fixed_term_duration = 'Select the fixed-term duration.';
      }
    }

    if (step === 2) {
      if (!formData.property_category) errors.property_category = 'Select a property category.';
      if (!formData.offering_type) errors.offering_type = 'Select what is being offered.';
    }

    if (step === 3) {
      if (!formData.state) errors.state = 'Select the county.';
      if (!formData.city?.trim()) errors.city = 'Select or enter the city or town.';
      if (!formData.street?.trim()) errors.street = 'Enter the property address.';
    }

    if (step === 4) {
      if ((formData.photos || []).length === 0) {
        errors.photos = 'Add at least 1 photo to continue.';
      } else if ((formData.photos || []).some((photo) => photo?.status === 'preparing')) {
        errors.photos = 'Please wait for your photos to finish preparing.';
      }
    }

    if (step === 5) {
      if (!formData.price_per_month) errors.price_per_month = 'Enter the monthly rent.';
      if (!formData.deposit) errors.deposit = 'Enter the security deposit.';
    }

    if (step === 8 && !formData.available_from) {
      errors.available_from = 'Select when the property is available from.';
    }

    return errors;
  };

  const handleFileChange = async (e, type) => {
    const files = Array.from(e.target.files);

    if (type === 'photos' && files.length > 0) {
      const photoFiles = files.filter((file) => file.type.startsWith('image/'));
      if (photoFiles.length === 0) return;

      const availableSlots = Math.max(0, 10 - (formData.photos || []).length);
      const selectedFiles = photoFiles.slice(0, availableSlots);
      if (selectedFiles.length === 0) return;

      const pendingItems = selectedFiles.map((file) =>
        createPhotoItem({
          url: URL.createObjectURL(file),
          status: 'preparing',
          originalName: file.name,
        })
      );

      setFormData((prev) => ({
        ...prev,
        photos: [...(prev.photos || []), ...pendingItems],
      }));

      setValidationErrors(prev => {
        if (!prev.photos) return prev;
        const next = { ...prev };
        delete next.photos;
        return next;
      });

      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      await Promise.all(
        pendingItems.map(async (item, index) => {
          const originalFile = selectedFiles[index];
          let preparedFile = originalFile;

          try {
            preparedFile = await imageCompression(originalFile, options);
          } catch (err) {
            console.error('Compression error:', err);
          }

          setFormData((prev) => ({
            ...prev,
            photos: (prev.photos || []).map((photo) =>
              photo.id === item.id
                ? { ...photo, file: preparedFile, status: 'ready' }
                : photo
            ),
          }));
        })
      );
    } else {
      const processedFiles = files.filter(f => type === 'videos' ? f.type.startsWith('video/') : false);
      setFormData(prev => {
        const current = prev[type] || [];
        const max = type === 'photos' ? 10 : 5;
        const newFiles = [...current, ...processedFiles].slice(0, max);
        return { ...prev, [type]: newFiles };
      });

      setValidationErrors(prev => {
        if (!prev[type]) return prev;
        const next = { ...prev };
        delete next[type];
        return next;
      });
    }

    e.target.value = '';
  };

  const removeFile = (type, idx) => {
    setFormData(prev => {
      const arr = [...prev[type]];
      const removed = arr[idx];
      arr.splice(idx, 1);
      if (type === 'photos' && removed?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      return { ...prev, [type]: arr };
    });
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error('Please fix the highlighted fields before continuing.');
        return;
    }

    setValidationErrors({});
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
    const errors = validateStep(8);
    if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error('Please fix the highlighted fields before publishing.');
        return;
    }

    if ((formData.photos || []).some((photo) => photo?.status === 'preparing')) {
        setValidationErrors((prev) => ({
          ...prev,
          photos: 'Please wait for your photos to finish preparing before publishing.',
        }));
        toast.error('Please wait for your photos to finish preparing.');
        setCurrentStep(4);
        return;
    }

    setValidationErrors({});
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
             if (photo?.file instanceof Blob) {
                 payload.append('new_photos[]', photo.file, photo.originalName || photo.file.name || 'photo.jpg');
             } else if (typeof photo?.url === 'string' && photo.url && !photo.url.startsWith('blob:')) {
                 payload.append('existing_photos[]', photo.url);
             }
        });
        formData.videos.forEach(video => {
             if (video instanceof Blob) payload.append('new_videos[]', video);
        });

        const url = isEditing ? `/api/properties/${initialData.id}` : '/api/properties/create';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetchWithCsrf(url, { method, body: payload });
        
        if (!res.ok) {
            const err = await res.json();
             throw new Error(err.error || 'Failed to save listing');
        }

        if (isEditing) {
            toast.success('Listing updated successfully!');
            if (onClose) {
                onClose();
            } else {
                router.push('/dashboard');
            }
        } else {
            toast.success('Your property has been submitted and is pending review. It will be reviewed shortly.');
            if (onClose) {
                onClose();
            } else {
                router.push('/my-properties');
            }
        }
        router.refresh();

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

            {Object.keys(validationErrors).length > 0 && (
                <div className="bg-terracotta-50 border border-terracotta-200 rounded-2xl p-4 mb-6 flex gap-3">
                    <MdChecklist className="text-terracotta-500 shrink-0" size={22} />
                    <div>
                        <h3 className="font-heading font-bold text-navy-950">A few details still need attention</h3>
                        <ul className="mt-2 space-y-1 text-sm text-navy-700 font-sans">
                            {Object.values(validationErrors).map((message) => (
                                <li key={message}>{message}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
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

            {currentStep === 1 && <BasicsForm formData={formData} handleChange={handleChange} errors={validationErrors} />}
            {currentStep === 2 && <PropertyForm formData={formData} handleChange={handleChange} errors={validationErrors} />}
            {currentStep === 3 && <LocationForm formData={formData} handleChange={handleChange} errors={validationErrors} />}
            {currentStep === 4 && <MediaUpload formData={formData} handleFileChange={handleFileChange} removeFile={removeFile} errors={validationErrors} />}
            {currentStep === 5 && <FinancialsForm formData={formData} handleChange={handleChange} errors={validationErrors} />}
            {currentStep === 6 && <AmenitiesForm formData={formData} handleChange={handleChange} />}
            {currentStep === 7 && <PreferencesForm formData={formData} handleChange={handleChange} />}
            {currentStep === 8 && <AvailabilityForm formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} removeFile={removeFile} errors={validationErrors} />}

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
