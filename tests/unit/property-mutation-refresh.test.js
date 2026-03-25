import { beforeEach, describe, expect, test, vi } from 'vitest';

const recomputeForProperty = vi.fn();
const asyncRebuildFeedsForProperty = vi.fn();
const upsertPropertyMatchingSnapshot = vi.fn();
const asyncRebuildFindPeopleShortlistsForProperty = vi.fn();
const getPropertyRecomputeVersionKeys = vi.fn();
const bumpCacheVersion = vi.fn();

vi.mock('../../core/services/matching/recompute-compatibility.service.js', () => ({
  recomputeForProperty,
}));

vi.mock('../../core/services/feeds/rebuild-feed.service.js', () => ({
  asyncRebuildFeedsForProperty,
}));

vi.mock('../../core/services/matching/features/snapshot.service.js', () => ({
  upsertPropertyMatchingSnapshot,
}));

vi.mock('../../core/services/matching/precompute/find-people-shortlist.js', () => ({
  asyncRebuildFindPeopleShortlistsForProperty,
}));

vi.mock('../../core/services/matching/matching-cache-versions.js', () => ({
  getPropertyRecomputeVersionKeys,
}));

vi.mock('../../core/utils/redis.js', () => ({
  bumpCacheVersion,
}));

describe('refreshPropertyMutationArtifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recomputeForProperty.mockResolvedValue(undefined);
    asyncRebuildFeedsForProperty.mockResolvedValue(undefined);
    upsertPropertyMatchingSnapshot.mockResolvedValue(undefined);
    asyncRebuildFindPeopleShortlistsForProperty.mockResolvedValue(undefined);
    bumpCacheVersion.mockResolvedValue(undefined);
    getPropertyRecomputeVersionKeys.mockReturnValue([
      'property-version:property-1',
      'user-version:user-1',
    ]);
  });

  test('recomputes property artifacts and bumps all cache versions', async () => {
    const { refreshPropertyMutationArtifacts } = await import('../../core/services/superadmin/property-mutation-refresh.js');
    const adminClient = { kind: 'admin' };

    await refreshPropertyMutationArtifacts(adminClient, {
      propertyId: 'property-1',
      ownerUserId: 'user-1',
    });

    expect(recomputeForProperty).toHaveBeenCalledWith(adminClient, 'property-1');
    expect(upsertPropertyMatchingSnapshot).toHaveBeenCalledWith(adminClient, 'property-1');
    expect(asyncRebuildFeedsForProperty).toHaveBeenCalledWith('property-1', adminClient);
    expect(asyncRebuildFindPeopleShortlistsForProperty).toHaveBeenCalledWith('property-1', adminClient);
    expect(getPropertyRecomputeVersionKeys).toHaveBeenCalledWith({
      propertyId: 'property-1',
      ownerUserId: 'user-1',
    });
    expect(bumpCacheVersion).toHaveBeenNthCalledWith(1, 'property-version:property-1');
    expect(bumpCacheVersion).toHaveBeenNthCalledWith(2, 'user-version:user-1');
  });
});

