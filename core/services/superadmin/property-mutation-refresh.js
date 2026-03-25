import { recomputeForProperty } from '../matching/recompute-compatibility.service.js';
import { asyncRebuildFeedsForProperty } from '../feeds/rebuild-feed.service.js';
import { upsertPropertyMatchingSnapshot } from '../matching/features/snapshot.service.js';
import { asyncRebuildFindPeopleShortlistsForProperty } from '../matching/precompute/find-people-shortlist.js';
import { getPropertyRecomputeVersionKeys } from '../matching/matching-cache-versions.js';
import { bumpCacheVersion } from '../../utils/redis.js';

export async function refreshPropertyMutationArtifacts(adminClient, { propertyId, ownerUserId }) {
  await recomputeForProperty(adminClient, propertyId);
  await Promise.all([
    upsertPropertyMatchingSnapshot(adminClient, propertyId),
    asyncRebuildFeedsForProperty(propertyId, adminClient),
    asyncRebuildFindPeopleShortlistsForProperty(propertyId, adminClient),
  ]);

  await Promise.all(
    getPropertyRecomputeVersionKeys({
      propertyId,
      ownerUserId,
    }).map((key) => bumpCacheVersion(key))
  );
}
