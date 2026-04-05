import { describe, expect, test } from 'vitest';
import { buildInitialListingFormData } from '../../core/services/properties/listing-form-state.js';

describe('listing form state', () => {
  test('separates existing images and videos when editing a property', () => {
    const initialData = {
      listed_by_role: 'live_out_landlord',
      property_type: 'apartment',
      property_media: [
        { url: 'image-one.jpg', media_type: 'image' },
        { url: 'video-one.mp4', media_type: 'video' },
        { url: 'image-two.jpg', media_type: 'image' },
      ],
      lifestyle_priorities: null,
      deal_breakers: null,
      amenities: null,
      transport_options: null,
      payment_methods: null,
    };

    const formData = buildInitialListingFormData(initialData);

    expect(formData.role).toBe('live_out_landlord');
    expect(formData.property_category).toBe('apartment');
    expect(formData.photos).toHaveLength(2);
    expect(formData.photos.map((photo) => photo.url)).toEqual([
      'image-one.jpg',
      'image-two.jpg',
    ]);
    expect(formData.videos).toEqual(['video-one.mp4']);
  });

  test('builds stable defaults for a new property form', () => {
    const formData = buildInitialListingFormData(null);

    expect(formData).toMatchObject({
      role: '',
      rental_type: 'monthly',
      property_category: 'apartment',
      offering_type: 'private_room',
      photos: [],
      videos: [],
      bills_option: 'some',
      occupation_preference: 'any',
      gender_preference: 'any',
      available_from: '',
      accept_viewings: true,
      is_public: true,
    });
  });
});
