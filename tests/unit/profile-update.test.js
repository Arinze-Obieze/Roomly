import { describe, expect, test } from 'vitest';
import { normalizeUserProfileUpdates } from '../../core/services/users/profile-update.js';

describe('profile update normalization', () => {
  test('converts an empty gender selection into null before persistence', () => {
    expect(
      normalizeUserProfileUpdates({
        full_name: 'Mahesh Gupta',
        phone_number: '',
        bio: '',
        date_of_birth: null,
        gender: '',
        privacy_setting: 'public',
      })
    ).toMatchObject({
      full_name: 'Mahesh Gupta',
      phone_number: null,
      bio: null,
      date_of_birth: null,
      gender: null,
      privacy_setting: 'public',
    });
  });

  test('preserves valid non-empty profile values', () => {
    expect(
      normalizeUserProfileUpdates({
        full_name: 'Mahesh Gupta',
        phone_number: '+3531234567',
        bio: 'Host in Dublin',
        gender: 'male',
      })
    ).toMatchObject({
      full_name: 'Mahesh Gupta',
      phone_number: '+3531234567',
      bio: 'Host in Dublin',
      gender: 'male',
    });
  });
});
