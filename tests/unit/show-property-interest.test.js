import { describe, expect, test } from 'vitest';
import { resolveShowPropertyInterestDecision } from '../../core/services/interests/show-property-interest.js';

describe('show property interest decision', () => {
  test('rejects showing interest in your own active listing', () => {
    expect(
      resolveShowPropertyInterestDecision({
        property: {
          id: 'prop-1',
          listed_by_user_id: 'user-1',
          is_active: true,
          is_public: true,
          privacy_setting: 'public',
        },
        userId: 'user-1',
        hasLifestyle: true,
        matchScore: 90,
      })
    ).toMatchObject({
      ok: false,
      status: 400,
      error: 'Cannot show interest in your own listing',
    });
  });

  test('requires lifestyle completion before showing interest', () => {
    expect(
      resolveShowPropertyInterestDecision({
        property: {
          id: 'prop-1',
          listed_by_user_id: 'host-1',
          is_active: true,
          is_public: true,
          privacy_setting: 'public',
        },
        userId: 'user-1',
        hasLifestyle: false,
        matchScore: 80,
      })
    ).toMatchObject({
      ok: false,
      status: 400,
      error: 'Complete your lifestyle in Profile to show interest.',
    });
  });

  test('keeps private listings pending even with a high match score', () => {
    expect(
      resolveShowPropertyInterestDecision({
        property: {
          id: 'prop-1',
          listed_by_user_id: 'host-1',
          is_active: true,
          is_public: false,
          privacy_setting: 'private',
        },
        userId: 'user-2',
        hasLifestyle: true,
        matchScore: 92,
      })
    ).toMatchObject({
      ok: true,
      initialStatus: 'pending',
      isPrivateListing: true,
    });
  });

  test('auto-accepts public listings only above the direct-contact threshold', () => {
    expect(
      resolveShowPropertyInterestDecision({
        property: {
          id: 'prop-1',
          listed_by_user_id: 'host-1',
          is_active: true,
          is_public: true,
          privacy_setting: 'public',
        },
        userId: 'user-2',
        hasLifestyle: true,
        matchScore: 50,
      }).initialStatus
    ).toBe('pending');

    expect(
      resolveShowPropertyInterestDecision({
        property: {
          id: 'prop-1',
          listed_by_user_id: 'host-1',
          is_active: true,
          is_public: true,
          privacy_setting: 'public',
        },
        userId: 'user-2',
        hasLifestyle: true,
        matchScore: 51,
      }).initialStatus
    ).toBe('accepted');
  });
});
