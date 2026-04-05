import { describe, expect, test } from 'vitest';
import { buildPropertyMultipartUpdates } from '../../core/services/properties/property-multipart-updates.js';

describe('property multipart update builder', () => {
  test('keeps editable listing fields that the route previously dropped', () => {
    const formData = new FormData();
    formData.append('title', 'Cherrywood Dublin 18 En-suite Double Bedroom');
    formData.append('description', 'Freshly updated');
    formData.append('role', 'live_out_landlord');
    formData.append('rental_type', 'monthly');
    formData.append('fixed_term_duration', '12');
    formData.append('property_category', 'apartment');
    formData.append('offering_type', 'shared_room');
    formData.append('price_per_month', '1100');
    formData.append('state', 'Dublin');
    formData.append('city', 'Dublin');
    formData.append('street', 'Cherrywood');
    formData.append('bedrooms', '1');
    formData.append('bathrooms', '1');
    formData.append('year_built', '2008');
    formData.append('ber_rating', 'B1');
    formData.append('available_from', '2026-05-01');
    formData.append('transport_options', JSON.stringify(['dart']));
    formData.append('is_gaeltacht', 'true');
    formData.append('amenities', JSON.stringify(['parking']));
    formData.append('deposit', '1500');
    formData.append('bills_option', 'some');
    formData.append('custom_bills', JSON.stringify([{ name: 'Electricity', amount: '50' }]));
    formData.append('couples_allowed', 'false');
    formData.append('payment_methods', JSON.stringify(['bank_transfer']));
    formData.append('occupation_preference', 'professional');
    formData.append('gender_preference', 'male');
    formData.append('age_min', '21');
    formData.append('age_max', '40');
    formData.append('lifestyle_priorities', JSON.stringify({ cleanliness: 'must_match' }));
    formData.append('deal_breakers', JSON.stringify(['pets']));
    formData.append('partner_description', 'Quiet professional preferred');
    formData.append('is_immediate', 'false');
    formData.append('min_stay_months', '12');
    formData.append('accept_viewings', 'false');
    formData.append('is_public', 'false');

    expect(buildPropertyMultipartUpdates(formData)).toMatchObject({
      rental_type: 'monthly',
      fixed_term_duration: 12,
      property_type: 'apartment',
      offering_type: 'shared_room',
      year_built: 2008,
      ber_rating: 'B1',
      deposit: 1500,
      transport_options: ['dart'],
      is_gaeltacht: true,
      occupation_preference: 'professional',
      gender_preference: 'male',
      age_min: 21,
      age_max: 40,
      partner_description: 'Quiet professional preferred',
      min_stay_months: 12,
      accept_viewings: false,
      is_public: false,
    });
  });

  test('normalizes optional empty strings to null for nullable fields', () => {
    const formData = new FormData();
    formData.append('title', 'Test');
    formData.append('description', 'Test');
    formData.append('ber_rating', '');
    formData.append('partner_description', '');
    formData.append('room_type', '');
    formData.append('bills_option', 'some');
    formData.append('deal_breakers', JSON.stringify([]));

    expect(buildPropertyMultipartUpdates(formData)).toMatchObject({
      ber_rating: null,
      partner_description: null,
      room_type: null,
    });
  });

  test('does not attempt to update generated bills_included column', () => {
    const formData = new FormData();
    formData.append('title', 'Test');
    formData.append('description', 'Test');
    formData.append('bills_option', 'box');
    formData.append('deal_breakers', JSON.stringify([]));

    const updates = buildPropertyMultipartUpdates(formData);

    expect(updates.bills_option).toBe('box');
    expect(updates).not.toHaveProperty('bills_included');
  });
});
