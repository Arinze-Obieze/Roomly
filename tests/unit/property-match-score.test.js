import { describe, expect, test } from 'vitest';
import {
  propertyMatchConfidence,
  propertyMatchScore,
} from '../../lib/matching/propertyMatchScore.js';

const baseProperty = {
  offering_type: 'private_room',
  city: 'Dublin',
  state: 'Dublin',
  price_per_month: 1000,
  gender_preference: 'any',
  occupation_preference: 'any',
  deal_breakers: [],
  available_from: '2030-01-01',
  is_immediate: false,
  lifestyle_priorities: {},
};

const baseLifestyle = {
  cleanliness_level: 2,
  schedule_type: 'day',
  smoking_status: 'no',
  social_level: 2,
  noise_tolerance: 2,
  pets: { has_pets: false },
  current_city: 'Dublin',
  occupation: 'professional',
};

const basePrefs = {
  budget_max: 1200,
  budget_min: 800,
  location_areas: ['Dublin'],
  move_in_window: 'flexible',
  accepted_smoking: [],
  accepted_pets: false,
};

describe('property match score', () => {
  test('penalizes host smoking and pets for seekers who do not accept them', () => {
    const lowFrictionScore = propertyMatchScore(
      baseProperty,
      baseLifestyle,
      basePrefs,
      { gender: 'female' },
      {
        cleanliness_level: 2,
        overnight_guests: 'rarely',
        occupation: 'professional',
        smoking_status: 'no',
        pets: { has_pets: false },
      },
      { gender: 'male' }
    );

    const highFrictionScore = propertyMatchScore(
      baseProperty,
      baseLifestyle,
      basePrefs,
      { gender: 'female' },
      {
        cleanliness_level: 2,
        overnight_guests: 'rarely',
        occupation: 'professional',
        smoking_status: 'yes',
        pets: { has_pets: true, types: ['cat'] },
      },
      { gender: 'male' }
    );

    expect(highFrictionScore).toBeLessThan(lowFrictionScore);
  });

  test('rewards seekers who accept host pets and smoking more than those who do not', () => {
    const strictScore = propertyMatchScore(
      baseProperty,
      baseLifestyle,
      basePrefs,
      { gender: 'female' },
      {
        cleanliness_level: 2,
        overnight_guests: 'rarely',
        occupation: 'professional',
        smoking_status: 'yes',
        pets: { has_pets: true },
      },
      { gender: 'male' }
    );

    const tolerantScore = propertyMatchScore(
      baseProperty,
      baseLifestyle,
      {
        ...basePrefs,
        accepted_smoking: ['occasionally'],
        accepted_pets: true,
      },
      { gender: 'female' },
      {
        cleanliness_level: 2,
        overnight_guests: 'rarely',
        occupation: 'professional',
        smoking_status: 'yes',
        pets: { has_pets: true },
      },
      { gender: 'male' }
    );

    expect(tolerantScore).toBeGreaterThan(strictScore);
  });

  test('returns lower confidence for sparse inputs than richer shared-space profiles', () => {
    const sparseConfidence = propertyMatchConfidence(
      baseProperty,
      null,
      basePrefs,
      {},
      null,
      {}
    );

    const richConfidence = propertyMatchConfidence(
      baseProperty,
      baseLifestyle,
      basePrefs,
      { gender: 'female', date_of_birth: '1995-01-01', occupation: 'professional' },
      {
        cleanliness_level: 2,
        overnight_guests: 'rarely',
        occupation: 'professional',
        smoking_status: 'no',
        pets: { has_pets: false },
      },
      { gender: 'male', date_of_birth: '1990-01-01', occupation: 'professional' }
    );

    expect(sparseConfidence).toBeLessThan(richConfidence);
    expect(richConfidence).toBeGreaterThanOrEqual(80);
  });

  test('rewards closer schedule, social, and noise alignment in shared spaces', () => {
    const alignedScore = propertyMatchScore(
      {
        ...baseProperty,
        lifestyle_priorities: {
          social: 'important',
          noise: 'very_important',
        },
      },
      {
        ...baseLifestyle,
        schedule_type: '9-5',
        social_level: 2,
        noise_tolerance: 2,
      },
      basePrefs,
      { gender: 'female' },
      {
        cleanliness_level: 2,
        overnight_guests: 'rarely',
        occupation: 'professional',
        smoking_status: 'no',
        pets: { has_pets: false },
        schedule_type: 'wfh',
        social_level: 2,
        noise_tolerance: 2,
      },
      { gender: 'male' }
    );

    const misalignedScore = propertyMatchScore(
      {
        ...baseProperty,
        lifestyle_priorities: {
          social: 'important',
          noise: 'very_important',
        },
      },
      {
        ...baseLifestyle,
        schedule_type: '9-5',
        social_level: 1,
        noise_tolerance: 1,
      },
      basePrefs,
      { gender: 'female' },
      {
        cleanliness_level: 2,
        overnight_guests: 'rarely',
        occupation: 'professional',
        smoking_status: 'no',
        pets: { has_pets: false },
        schedule_type: 'shift',
        social_level: 3,
        noise_tolerance: 3,
      },
      { gender: 'male' }
    );

    expect(alignedScore).toBeGreaterThan(misalignedScore);
  });

  test('rewards shared interests between host and seeker', () => {
    const sharedInterestScore = propertyMatchScore(
      baseProperty,
      {
        ...baseLifestyle,
        interests: ['music', 'hiking', 'cooking'],
      },
      basePrefs,
      { gender: 'female' },
      {
        cleanliness_level: 2,
        overnight_guests: 'rarely',
        occupation: 'professional',
        smoking_status: 'no',
        pets: { has_pets: false },
        schedule_type: '9-5',
        social_level: 2,
        noise_tolerance: 2,
        interests: ['music', 'cooking', 'films'],
      },
      { gender: 'male' }
    );

    const noOverlapScore = propertyMatchScore(
      baseProperty,
      {
        ...baseLifestyle,
        interests: ['music', 'hiking', 'cooking'],
      },
      basePrefs,
      { gender: 'female' },
      {
        cleanliness_level: 2,
        overnight_guests: 'rarely',
        occupation: 'professional',
        smoking_status: 'no',
        pets: { has_pets: false },
        schedule_type: '9-5',
        social_level: 2,
        noise_tolerance: 2,
        interests: ['gaming', 'football', 'travel'],
      },
      { gender: 'male' }
    );

    expect(sharedInterestScore).toBeGreaterThan(noOverlapScore);
  });
});
