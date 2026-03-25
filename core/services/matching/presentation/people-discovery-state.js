import { resolveUserProfileVisibility } from '../../users/profile-privacy.js';

export function normalizeProfileVisibility(subject = {}) {
  return resolveUserProfileVisibility(subject);
}

export function getPeopleDiscoveryState({
  subject = {},
  matchScore = null,
  minMatch = 70,
  hasMutualReveal = false,
} = {}) {
  const profileVisibility = normalizeProfileVisibility(subject);
  const isPrivateProfile = profileVisibility === 'private';
  const meetsThreshold = typeof matchScore === 'number' && matchScore >= minMatch;
  const isVisible = !isPrivateProfile || hasMutualReveal || meetsThreshold;
  const isRevealed = !isPrivateProfile || hasMutualReveal;
  const shouldBlurProfile = isVisible && !isRevealed;

  return {
    profileVisibility,
    isPrivateProfile,
    isVisible,
    isRevealed,
    shouldBlurProfile,
    ctaState: shouldBlurProfile ? 'show_interest' : 'contact',
    ctaLabel: shouldBlurProfile ? 'Show Interest' : 'Contact',
  };
}

export function getPeopleContactState({
  subject = {},
  hasRevealRelationship = false,
} = {}) {
  const profileVisibility = normalizeProfileVisibility(subject);
  const isPrivateProfile = profileVisibility === 'private';
  const contactAllowed = !isPrivateProfile || hasRevealRelationship;

  return {
    profileVisibility,
    isPrivateProfile,
    contactAllowed,
    contactGate: contactAllowed ? 'direct' : 'interest_required',
  };
}
