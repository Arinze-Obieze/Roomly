export function createPhotoItem({ file = null, url = '', status = 'ready', originalName = '' }) {
  return {
    id: `${status}-${Math.random().toString(36).slice(2, 10)}`,
    file,
    url,
    status,
    originalName,
  };
}

export function buildInitialListingFormData(initialData = null) {
  if (initialData) {
    return {
      ...initialData,
      role: initialData.listed_by_role || initialData.role || '',
      photos: initialData.property_media
        ?.filter((media) => media.media_type === 'image')
        .map((media) => createPhotoItem({ url: media.url, status: 'ready' })) || [],
      videos: initialData.property_media
        ?.filter((media) => media.media_type === 'video')
        .map((media) => media.url) || [],
      lifestyle_priorities: initialData.lifestyle_priorities || {},
      deal_breakers: initialData.deal_breakers || [],
      amenities: initialData.amenities || [],
      transport_options: initialData.transport_options || [],
      payment_methods: initialData.payment_methods || [],
    };
  }

  return {
    role: '',
    rental_type: 'monthly',
    title: '',
    description: '',
    property_category: 'apartment',
    offering_type: 'private_room',
    bedrooms: 1,
    bathrooms: 1,
    floor_area: '',
    year_built: '',
    ber_rating: '',
    state: '',
    city: '',
    street: '',
    latitude: null,
    longitude: null,
    transport_options: [],
    is_gaeltacht: false,
    photos: [],
    videos: [],
    price_per_month: '',
    deposit: '',
    bills_option: 'some',
    custom_bills: [],
    couples_allowed: false,
    payment_methods: [],
    amenities: [],
    occupation_preference: 'any',
    gender_preference: 'any',
    age_min: 18,
    age_max: 99,
    lifestyle_priorities: {},
    deal_breakers: [],
    partner_description: '',
    available_from: '',
    is_immediate: false,
    min_stay_months: 6,
    accept_viewings: true,
    is_public: true,
  };
}
