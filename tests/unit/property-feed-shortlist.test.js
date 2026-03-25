import { describe, expect, test } from 'vitest';
import { hasActivePropertyFilters } from '../../core/services/matching/precompute/property-feed-shortlist.js';

describe('property feed shortlist helper', () => {
  test('treats empty filters as eligible for precomputed shortlist usage', () => {
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

  test('detects meaningful filters that should bypass the precomputed shortlist', () => {
    expect(hasActivePropertyFilters({
      location: 'dublin',
      amenities: [],
      billsIncluded: false,
    })).toBe(true);

    expect(hasActivePropertyFilters({
      bedrooms: [2],
    })).toBe(true);
  });
});
