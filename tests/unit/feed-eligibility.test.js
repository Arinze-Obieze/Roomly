import { describe, expect, test } from 'vitest';
import { canIncludePropertyInSeekerFeed } from '../../core/services/feeds/feed-eligibility.js';

describe('feed eligibility', () => {
  test('requires approved active listings', () => {
    expect(
      canIncludePropertyInSeekerFeed({
        property: {
          is_active: false,
          approval_status: 'approved',
          privacy_setting: 'public',
        },
        matchScore: 88,
      })
    ).toBe(false);

    expect(
      canIncludePropertyInSeekerFeed({
        property: {
          is_active: true,
          approval_status: 'pending',
          privacy_setting: 'public',
        },
        matchScore: 88,
      })
    ).toBe(false);
  });

  test('keeps private listings below 70 out of seeker feeds unless interest was accepted', () => {
    expect(
      canIncludePropertyInSeekerFeed({
        property: {
          is_active: true,
          approval_status: 'approved',
          privacy_setting: 'private',
        },
        matchScore: 69,
      })
    ).toBe(false);

    expect(
      canIncludePropertyInSeekerFeed({
        property: {
          is_active: true,
          approval_status: 'approved',
          privacy_setting: 'private',
        },
        matchScore: 69,
        hasAcceptedInterest: true,
      })
    ).toBe(true);
  });

  test('allows strong private matches and public approved listings', () => {
    expect(
      canIncludePropertyInSeekerFeed({
        property: {
          is_active: true,
          approval_status: 'approved',
          privacy_setting: 'private',
        },
        matchScore: 70,
      })
    ).toBe(true);

    expect(
      canIncludePropertyInSeekerFeed({
        property: {
          is_active: true,
          approval_status: 'approved',
          privacy_setting: 'public',
        },
        matchScore: 52,
      })
    ).toBe(true);
  });
});
