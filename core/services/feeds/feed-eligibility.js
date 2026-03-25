import {
  canSeePrivateListing,
  isPrivateListing,
} from '../matching/rules/property-visibility.js';

export function canIncludePropertyInSeekerFeed({
  property = null,
  matchScore = null,
  hasAcceptedInterest = false,
} = {}) {
  if (!property) return false;
  if (property.is_active !== true) return false;
  if (property.approval_status !== 'approved') return false;

  return canSeePrivateListing({
    isPrivate: isPrivateListing(property),
    matchScore,
    hasAcceptedInterest,
  });
}
