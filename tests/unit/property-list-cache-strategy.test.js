import { describe, expect, test } from 'vitest';
import {
  getPropertyListCacheTtl,
  shouldUsePropertyListCache,
} from '../../core/services/matching/property-list-cache-strategy.js';

describe('property list cache strategy', () => {
  test('caches anonymous property list requests', () => {
    expect(
      shouldUsePropertyListCache({
        hasUser: false,
        sortBy: 'recommended',
        skipCache: false,
      })
    ).toBe(true);
    expect(getPropertyListCacheTtl({ hasUser: false })).toBe(300);
  });

  test('caches authenticated standard-sort requests', () => {
    expect(
      shouldUsePropertyListCache({
        hasUser: true,
        sortBy: 'newest',
        skipCache: false,
      })
    ).toBe(true);
    expect(getPropertyListCacheTtl({ hasUser: true })).toBe(60);
  });

  test('bypasses cache for authenticated personalized sorts', () => {
    expect(
      shouldUsePropertyListCache({
        hasUser: true,
        sortBy: 'match',
        skipCache: false,
      })
    ).toBe(false);

    expect(
      shouldUsePropertyListCache({
        hasUser: true,
        sortBy: 'recommended',
        skipCache: false,
      })
    ).toBe(false);
  });

  test('bypasses cache whenever noStore is requested', () => {
    expect(
      shouldUsePropertyListCache({
        hasUser: false,
        sortBy: 'newest',
        skipCache: true,
      })
    ).toBe(false);

    expect(
      shouldUsePropertyListCache({
        hasUser: true,
        sortBy: 'newest',
        skipCache: true,
      })
    ).toBe(false);
  });
});
