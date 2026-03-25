import { describe, expect, test } from 'vitest';
import {
  getBulkMatchingRecomputeVersionKeys,
  getProfileUpdateVersionKeys,
  getPropertyCreationVersionKeys,
  getPropertyRecomputeVersionKeys,
  getPropertyInterestMutationVersionKeys,
  getSeekerRecomputeVersionKeys,
} from '../../core/services/matching/matching-cache-versions.js';

describe('matching cache version helpers', () => {
  test('returns all seeker recompute cache versions that should be bumped', () => {
    expect(getSeekerRecomputeVersionKeys('user-123')).toEqual([
      'v:properties:user:user-123',
      'v:feed:match:user:user-123',
      'v:feed:recommended:user:user-123',
      'v:find_people:host:user-123',
      'v:find_people:seeker:user-123',
      'v:interests:user:user-123',
    ]);
  });

  test('returns all property recompute cache versions that should be bumped', () => {
    expect(
      getPropertyRecomputeVersionKeys({
        propertyId: 'prop-123',
        ownerUserId: 'host-123',
      })
    ).toEqual([
      'v:properties:global',
      'v:find_people:global',
      'v:property:prop-123',
      'v:properties:user:host-123',
      'v:find_people:host:host-123',
      'v:find_people:seeker:host-123',
      'v:interests:user:host-123',
    ]);
  });

  test('returns property creation cache versions', () => {
    expect(
      getPropertyCreationVersionKeys({
        propertyId: 'prop-123',
        ownerUserId: 'host-123',
      })
    ).toEqual([
      'v:properties:global',
      'v:find_people:global',
      'v:property:prop-123',
      'v:properties:user:host-123',
      'v:find_people:host:host-123',
      'v:find_people:seeker:host-123',
      'v:interests:user:host-123',
    ]);
  });

  test('returns the global cache versions for bulk matching recompute', () => {
    expect(getBulkMatchingRecomputeVersionKeys()).toEqual([
      'v:properties:global',
      'v:find_people:global',
    ]);
  });

  test('returns property-interest mutation cache versions', () => {
    expect(
      getPropertyInterestMutationVersionKeys({
        propertyId: 'prop-123',
        seekerUserId: 'seeker-123',
        hostUserId: 'host-123',
      })
    ).toEqual([
      'v:properties:global',
      'v:property:prop-123',
      'v:properties:user:seeker-123',
      'v:interests:seeker:seeker-123',
      'v:interests:landlord:host-123',
      'v:interests:user:seeker-123',
      'v:interests:user:host-123',
      'v:find_people:host:host-123',
      'v:find_people:seeker:seeker-123',
    ]);
  });

  test('returns profile update cache versions', () => {
    expect(getProfileUpdateVersionKeys('user-123')).toEqual([
      'v:user:user-123',
      'v:profile_visibility:user-123',
      'v:properties:user:user-123',
      'v:interests:user:user-123',
      'v:find_people:host:user-123',
      'v:find_people:seeker:user-123',
    ]);
  });
});
