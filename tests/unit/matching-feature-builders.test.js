import { describe, expect, test } from 'vitest';
import { buildUserMatchingFeatures } from '../../core/services/matching/features/build-user-features.js';
import { buildPropertyMatchingFeatures } from '../../core/services/matching/features/build-property-features.js';

describe('matching feature builders', () => {
  test('builds normalized user matching features from profile, lifestyle, and preferences', () => {
    const row = buildUserMatchingFeatures({
      user: {
        id: 'user-1',
        date_of_birth: '2000-03-20',
        privacy_setting: 'private',
      },
      lifestyle: {
        user_id: 'user-1',
        current_city: ' Dublin ',
        preferred_property_types: ['Apartment', ' House Share '],
        interests: [' Music ', 'Fitness'],
        schedule_type: '9-5',
        cleanliness_level: 3,
        social_level: 2,
        noise_tolerance: 1,
      },
      preferences: {
        user_id: 'user-1',
        budget_min: 900,
        budget_max: 1500,
      },
      now: new Date('2026-03-25T12:00:00.000Z'),
    });

    expect(row).toMatchObject({
      user_id: 'user-1',
      profile_completion_state: 'complete',
      has_lifestyle: true,
      has_preferences: true,
      privacy_setting: 'private',
      current_city_normalized: 'dublin',
      budget_min: 900,
      budget_max: 1500,
      preferred_property_types: ['apartment', 'house share'],
      interests: ['music', 'fitness'],
      age_years: 26,
    });
  });

  test('builds normalized property matching features with price and freshness buckets', () => {
    const row = buildPropertyMatchingFeatures({
      property: {
        id: 'property-1',
        listed_by_user_id: 'host-1',
        approval_status: 'approved',
        is_active: true,
        privacy_setting: 'private',
        city: 'Galway ',
        state: 'Connacht',
        price_per_month: 1650,
        property_type: 'Apartment',
        offering_type: 'Private_Room',
        available_from: '2026-04-01',
        created_at: '2026-03-24T12:00:00.000Z',
      },
      hostLifestyle: {
        schedule_type: 'Remote',
        interests: ['Cooking', ' Travel '],
      },
      mediaCount: 3,
      now: new Date('2026-03-25T12:00:00.000Z'),
    });

    expect(row).toMatchObject({
      property_id: 'property-1',
      host_user_id: 'host-1',
      approval_status: 'approved',
      is_active: true,
      is_private: true,
      city_normalized: 'galway',
      price_band: 'premium',
      property_type: 'apartment',
      offering_type: 'private_room',
      media_count: 3,
      has_media: true,
      host_schedule_type: 'remote',
      host_interests: ['cooking', 'travel'],
      freshness_bucket: 'new',
    });
  });
});
