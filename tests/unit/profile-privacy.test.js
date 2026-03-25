import { describe, expect, test } from 'vitest';
import {
  isUserProfilePrivate,
  normalizeUserPrivacyUpdates,
  resolveUserProfileVisibility,
} from '../../core/services/users/profile-privacy.js';

describe('profile privacy normalization', () => {
  test('resolves from either privacy field', () => {
    expect(resolveUserProfileVisibility({ privacy_setting: 'private' })).toBe('private');
    expect(resolveUserProfileVisibility({ profile_visibility: 'private' })).toBe('private');
    expect(resolveUserProfileVisibility({ users: { profile_visibility: 'public' } })).toBe('public');
    expect(resolveUserProfileVisibility({})).toBe('public');
  });

  test('recognizes private profiles through the shared helper', () => {
    expect(isUserProfilePrivate({ privacy_setting: 'private' })).toBe(true);
    expect(isUserProfilePrivate({ profile_visibility: 'public' })).toBe(false);
  });

  test('syncs both privacy fields on write normalization', () => {
    expect(normalizeUserPrivacyUpdates({ privacy_setting: 'private' })).toMatchObject({
      privacy_setting: 'private',
      profile_visibility: 'private',
    });

    expect(normalizeUserPrivacyUpdates({ profile_visibility: 'public' })).toMatchObject({
      privacy_setting: 'public',
      profile_visibility: 'public',
    });
  });
});
