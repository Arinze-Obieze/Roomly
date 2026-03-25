import { describe, expect, test } from 'vitest';
import { decodeShortlistMember } from '../../core/services/matching/precompute/find-people-shortlist.js';

describe('find-people shortlist helpers', () => {
  test('decodes shortlist members with accepted-interest flag', () => {
    expect(decodeShortlistMember('user-1:property-1:1')).toEqual({
      primaryId: 'user-1',
      propertyId: 'property-1',
      accepted: true,
    });
  });

  test('treats missing accepted-interest flag as false', () => {
    expect(decodeShortlistMember('user-2:property-2')).toEqual({
      primaryId: 'user-2',
      propertyId: 'property-2',
      accepted: false,
    });
  });

  test('returns null for malformed shortlist members', () => {
    expect(decodeShortlistMember('')).toBeNull();
    expect(decodeShortlistMember('user-only')).toBeNull();
  });
});
