export const PRIVATE_LISTING_MATCH_THRESHOLD = 70;
export const DIRECT_CONTACT_MATCH_THRESHOLD = 51;

export function isPrivateListing(property = {}) {
  return property?.privacy_setting === 'private' || property?.is_public === false;
}

export function canSeePrivateListing({
  isPrivate,
  isOwner = false,
  hasAcceptedInterest = false,
  matchScore = null,
  threshold = PRIVATE_LISTING_MATCH_THRESHOLD,
} = {}) {
  if (!isPrivate) return true;
  if (isOwner || hasAcceptedInterest) return true;
  return typeof matchScore === 'number' && matchScore >= threshold;
}

export function shouldMaskPrivateListing({
  isPrivate,
  isOwner = false,
  hasAcceptedInterest = false,
} = {}) {
  return !!isPrivate && !isOwner && !hasAcceptedInterest;
}

export function getPropertyContactState({
  property = {},
  isOwner = false,
  hasAcceptedInterest = false,
  matchScore = null,
  missingProfile = false,
} = {}) {
  const isPrivate = isPrivateListing(property);

  if (isOwner) {
    return {
      visibility: isPrivate ? 'private' : 'public',
      isPrivate,
      contactGate: 'direct',
      contactAllowed: true,
    };
  }

  if (missingProfile) {
    return {
      visibility: isPrivate ? 'private' : 'public',
      isPrivate,
      contactGate: 'profile_required',
      contactAllowed: false,
    };
  }

  if (hasAcceptedInterest) {
    return {
      visibility: isPrivate ? 'private' : 'public',
      isPrivate,
      contactGate: 'direct',
      contactAllowed: true,
    };
  }

  if (isPrivate) {
    return {
      visibility: 'private',
      isPrivate: true,
      contactGate: 'interest_required',
      contactAllowed: false,
    };
  }

  const qualifiesForDirectContact =
    typeof matchScore === 'number' && matchScore >= DIRECT_CONTACT_MATCH_THRESHOLD;

  return {
    visibility: 'public',
    isPrivate: false,
    contactGate: qualifiesForDirectContact ? 'direct' : 'interest_required',
    contactAllowed: qualifiesForDirectContact,
  };
}
