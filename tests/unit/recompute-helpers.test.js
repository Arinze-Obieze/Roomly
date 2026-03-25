import { describe, expect, test } from 'vitest';
import {
  buildSeekerLifestyle,
  hasMatchingProfile,
  isEligiblePropertyForMatching,
  mergeUniqueUserIds,
} from '../../core/services/matching/recompute-helpers.js';

describe('recompute helpers', () => {
  test('treats either lifestyle or preferences as enough profile data for matching', () => {
    expect(hasMatchingProfile({ lifestyle: { user_id: 'a' }, preferences: null })).toBe(true);
    expect(hasMatchingProfile({ lifestyle: null, preferences: { user_id: 'a' } })).toBe(true);
    expect(hasMatchingProfile({ lifestyle: null, preferences: null })).toBe(false);
  });

  test('merges seeker ids from multiple profile sources without duplicates', () => {
    expect(
      mergeUniqueUserIds(
        [{ user_id: 'u1' }, { user_id: 'u2' }],
        [{ user_id: 'u2' }, { user_id: 'u3' }, { user_id: null }]
      )
    ).toEqual(['u1', 'u2', 'u3']);
  });

  test('requires active approved properties for standard matching scope', () => {
    expect(isEligiblePropertyForMatching({ is_active: true, approval_status: 'approved' })).toBe(true);
    expect(isEligiblePropertyForMatching({ is_active: true, approval_status: 'pending' })).toBe(false);
    expect(isEligiblePropertyForMatching({ is_active: false, approval_status: 'approved' })).toBe(false);
  });

  test('builds a lifestyle object only when a lifestyle row exists', () => {
    expect(buildSeekerLifestyle(null)).toBeNull();
    expect(
      buildSeekerLifestyle(
        {
          cleanliness_level: 3,
          schedule_type: 'night_shift',
          occupation: '',
          current_city: 'Dublin',
        },
        { occupation: 'professional' }
      )
    ).toMatchObject({
      cleanliness_level: 3,
      schedule_type: 'night_shift',
      occupation: 'professional',
      current_city: 'Dublin',
    });
  });
});
