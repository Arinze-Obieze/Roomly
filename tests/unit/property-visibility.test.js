import { describe, expect, test } from 'vitest';
import {
  DIRECT_CONTACT_MATCH_THRESHOLD,
  PRIVATE_LISTING_MATCH_THRESHOLD,
  canSeePrivateListing,
  getPropertyContactState,
  isPrivateListing,
  shouldMaskPrivateListing,
} from '../../core/services/matching/rules/property-visibility.js';

describe('property visibility rules', () => {
  test('recognizes private listing semantics from either privacy field', () => {
    expect(isPrivateListing({ privacy_setting: 'private' })).toBe(true);
    expect(isPrivateListing({ is_public: false })).toBe(true);
    expect(isPrivateListing({ privacy_setting: 'public', is_public: true })).toBe(false);
  });

  test('allows private listing visibility at the 70 threshold', () => {
    expect(
      canSeePrivateListing({
        isPrivate: true,
        matchScore: PRIVATE_LISTING_MATCH_THRESHOLD - 1,
      })
    ).toBe(false);

    expect(
      canSeePrivateListing({
        isPrivate: true,
        matchScore: PRIVATE_LISTING_MATCH_THRESHOLD,
      })
    ).toBe(true);
  });

  test('masks private listing identity until owner or accepted interest', () => {
    expect(shouldMaskPrivateListing({ isPrivate: true })).toBe(true);
    expect(shouldMaskPrivateListing({ isPrivate: true, hasAcceptedInterest: true })).toBe(false);
    expect(shouldMaskPrivateListing({ isPrivate: true, isOwner: true })).toBe(false);
  });

  test('requires 51+ for direct contact on public listings', () => {
    expect(
      getPropertyContactState({
        property: { privacy_setting: 'public', is_public: true },
        matchScore: DIRECT_CONTACT_MATCH_THRESHOLD - 1,
      })
    ).toMatchObject({
      contactGate: 'interest_required',
      contactAllowed: false,
    });

    expect(
      getPropertyContactState({
        property: { privacy_setting: 'public', is_public: true },
        matchScore: DIRECT_CONTACT_MATCH_THRESHOLD,
      })
    ).toMatchObject({
      contactGate: 'direct',
      contactAllowed: true,
    });
  });

  test('keeps private listing contact behind interest acceptance', () => {
    expect(
      getPropertyContactState({
        property: { privacy_setting: 'private', is_public: false },
        matchScore: 99,
      })
    ).toMatchObject({
      isPrivate: true,
      contactGate: 'interest_required',
      contactAllowed: false,
    });

    expect(
      getPropertyContactState({
        property: { privacy_setting: 'private', is_public: false },
        hasAcceptedInterest: true,
        matchScore: 99,
      })
    ).toMatchObject({
      contactGate: 'direct',
      contactAllowed: true,
    });
  });
});
