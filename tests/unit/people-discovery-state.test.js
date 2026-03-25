import { describe, expect, test } from 'vitest';
import {
  getPeopleContactState,
  getPeopleDiscoveryState,
  normalizeProfileVisibility,
} from '../../core/services/matching/presentation/people-discovery-state.js';

describe('people discovery state', () => {
  test('normalizes profile visibility from either privacy field', () => {
    expect(normalizeProfileVisibility({ privacy_setting: 'private' })).toBe('private');
    expect(normalizeProfileVisibility({ profile_visibility: 'private' })).toBe('private');
    expect(normalizeProfileVisibility({ users: { privacy_setting: 'public' } })).toBe('public');
    expect(normalizeProfileVisibility({})).toBe('public');
  });

  test('blurs private strong matches until mutual reveal exists', () => {
    expect(
      getPeopleDiscoveryState({
        subject: { privacy_setting: 'private' },
        matchScore: 82,
        minMatch: 70,
        hasMutualReveal: false,
      })
    ).toMatchObject({
      isPrivateProfile: true,
      isVisible: true,
      isRevealed: false,
      shouldBlurProfile: true,
      ctaState: 'show_interest',
      ctaLabel: 'Show Interest',
    });
  });

  test('reveals private profiles after mutual reveal', () => {
    expect(
      getPeopleDiscoveryState({
        subject: { profile_visibility: 'private' },
        matchScore: 82,
        minMatch: 70,
        hasMutualReveal: true,
      })
    ).toMatchObject({
      isVisible: true,
      isRevealed: true,
      shouldBlurProfile: false,
      ctaState: 'contact',
      ctaLabel: 'Contact',
    });
  });

  test('keeps public profiles revealed', () => {
    expect(
      getPeopleDiscoveryState({
        subject: { privacy_setting: 'public' },
        matchScore: 55,
        minMatch: 70,
      })
    ).toMatchObject({
      isPrivateProfile: false,
      isVisible: true,
      isRevealed: true,
      shouldBlurProfile: false,
      ctaState: 'contact',
    });
  });

  test('blocks direct contact for private profiles until reveal relationship exists', () => {
    expect(
      getPeopleContactState({
        subject: { privacy_setting: 'private' },
        hasRevealRelationship: false,
      })
    ).toMatchObject({
      isPrivateProfile: true,
      contactAllowed: false,
      contactGate: 'interest_required',
    });

    expect(
      getPeopleContactState({
        subject: { profile_visibility: 'private' },
        hasRevealRelationship: true,
      })
    ).toMatchObject({
      isPrivateProfile: true,
      contactAllowed: true,
      contactGate: 'direct',
    });
  });
});
