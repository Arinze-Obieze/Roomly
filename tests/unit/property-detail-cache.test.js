import { describe, expect, test } from 'vitest';
import { buildPropertyDetailCacheKey } from '../../core/services/properties/property-detail-cache.js';

describe('property detail cache key', () => {
  test('returns the same key for the same property, user, and versions', () => {
    const versions = { global: 1, user: 2, property: 3 };
    const first = buildPropertyDetailCacheKey('prop-1', 'user-1', versions);
    const second = buildPropertyDetailCacheKey('prop-1', 'user-1', versions);

    expect(first).toBe(second);
    expect(first.startsWith('property:')).toBe(true);
  });

  test('changes when the viewer changes', () => {
    const versions = { global: 1, user: 2, property: 3 };
    expect(
      buildPropertyDetailCacheKey('prop-1', 'user-1', versions)
    ).not.toBe(
      buildPropertyDetailCacheKey('prop-1', 'user-2', versions)
    );
  });

  test('changes when cache versions change', () => {
    expect(
      buildPropertyDetailCacheKey('prop-1', 'user-1', { global: 1, user: 2, property: 3 })
    ).not.toBe(
      buildPropertyDetailCacheKey('prop-1', 'user-1', { global: 2, user: 2, property: 3 })
    );
  });
});
