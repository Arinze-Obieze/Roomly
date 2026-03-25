import {
  buildPeopleMatchReasons,
  buildPropertyMatchReasons,
} from './match-explanations.js';

export function buildConversationMatchContext({
  viewerRole,
  property = {},
  matchScore = null,
  seekerLifestyle = null,
  seekerPrefs = null,
  hostLifestyle = null,
} = {}) {
  const normalizedRole = viewerRole === 'host' ? 'host' : 'seeker';

  const reasons = normalizedRole === 'host'
    ? buildPeopleMatchReasons({
      actorLifestyle: hostLifestyle,
      counterpartLifestyle: seekerLifestyle,
      property,
      limit: 3,
    })
    : buildPropertyMatchReasons({
      property,
      seekerLifestyle,
      seekerPrefs,
      hostLifestyle,
      limit: 3,
    });

  const headline = normalizedRole === 'host'
    ? 'Why this tenant fits your listing'
    : 'Why this listing fits you';

  return {
    headline,
    matchScore: typeof matchScore === 'number' ? Math.round(matchScore) : null,
    reasons,
  };
}
