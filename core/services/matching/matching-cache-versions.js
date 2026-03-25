export function getSeekerRecomputeVersionKeys(userId) {
  return [
    `v:properties:user:${userId}`,
    `v:feed:match:user:${userId}`,
    `v:feed:recommended:user:${userId}`,
    `v:find_people:host:${userId}`,
    `v:find_people:seeker:${userId}`,
    `v:interests:user:${userId}`,
  ];
}

export function getPropertyRecomputeVersionKeys({ propertyId, ownerUserId }) {
  return [
    'v:properties:global',
    'v:find_people:global',
    `v:property:${propertyId}`,
    `v:properties:user:${ownerUserId}`,
    `v:find_people:host:${ownerUserId}`,
    `v:find_people:seeker:${ownerUserId}`,
    `v:interests:user:${ownerUserId}`,
  ];
}

export function getPropertyCreationVersionKeys({ propertyId, ownerUserId }) {
  return [
    'v:properties:global',
    'v:find_people:global',
    `v:property:${propertyId}`,
    `v:properties:user:${ownerUserId}`,
    `v:find_people:host:${ownerUserId}`,
    `v:find_people:seeker:${ownerUserId}`,
    `v:interests:user:${ownerUserId}`,
  ];
}

export function getBulkMatchingRecomputeVersionKeys() {
  return [
    'v:properties:global',
    'v:find_people:global',
  ];
}

export function getPropertyInterestMutationVersionKeys({ propertyId, seekerUserId, hostUserId }) {
  return [
    'v:properties:global',
    `v:property:${propertyId}`,
    `v:properties:user:${seekerUserId}`,
    `v:interests:seeker:${seekerUserId}`,
    `v:interests:landlord:${hostUserId}`,
    `v:interests:user:${seekerUserId}`,
    `v:interests:user:${hostUserId}`,
    `v:find_people:host:${hostUserId}`,
    `v:find_people:seeker:${seekerUserId}`,
  ];
}

export function getProfileUpdateVersionKeys(userId) {
  return [
    `v:user:${userId}`,
    `v:profile_visibility:${userId}`,
    `v:properties:user:${userId}`,
    `v:interests:user:${userId}`,
    `v:find_people:host:${userId}`,
    `v:find_people:seeker:${userId}`,
  ];
}
