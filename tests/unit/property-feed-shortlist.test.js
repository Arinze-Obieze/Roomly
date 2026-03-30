import { beforeEach, describe, expect, test, vi } from 'vitest';

const callRedis = vi.fn();

vi.mock('../../core/utils/redis.js', () => ({
  callRedis,
}));

describe('property feed shortlist helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('treats empty filters as eligible for precomputed shortlist usage', async () => {
    const { hasActivePropertyFilters } = await import('../../core/services/matching/precompute/property-feed-shortlist.js');
    expect(hasActivePropertyFilters({
      priceRange: null,
      minPrice: Number.NaN,
      maxPrice: Number.NaN,
      bedrooms: [],
      amenities: [],
      location: '',
      search: '',
      billsIncluded: false,
    })).toBe(false);
  });

  test('detects meaningful filters that should bypass the precomputed shortlist', async () => {
    const { hasActivePropertyFilters } = await import('../../core/services/matching/precompute/property-feed-shortlist.js');
    expect(hasActivePropertyFilters({
      location: 'dublin',
      amenities: [],
      billsIncluded: false,
    })).toBe(true);

    expect(hasActivePropertyFilters({
      bedrooms: [2],
    })).toBe(true);
  });

  test('reads rank-aware property windows for cursor pagination', async () => {
    callRedis
      .mockResolvedValueOnce(['property-3', 'property-4'])
      .mockResolvedValueOnce('7');

    const {
      getPrecomputedPropertyWindow,
      getPrecomputedPropertyRank,
    } = await import('../../core/services/matching/precompute/property-feed-shortlist.js');

    await expect(getPrecomputedPropertyWindow('user-1', 'recommended', 2, 2))
      .resolves.toEqual(['property-3', 'property-4']);
    await expect(getPrecomputedPropertyRank('user-1', 'recommended', 'property-4'))
      .resolves.toBe(7);
  });
});
