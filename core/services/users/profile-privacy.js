function normalizeValue(value) {
  return String(value || '').toLowerCase().trim();
}

export function resolveUserProfileVisibility(subject = {}) {
  const direct = subject?.profile_visibility ?? subject?.privacy_setting;
  const nested = subject?.users?.profile_visibility ?? subject?.users?.privacy_setting;
  const normalized = normalizeValue(direct ?? nested);
  return normalized === 'private' ? 'private' : 'public';
}

export function isUserProfilePrivate(subject = {}) {
  return resolveUserProfileVisibility(subject) === 'private';
}

export function normalizeUserPrivacyUpdates(updates = {}) {
  const next = { ...updates };
  const resolved = updates?.privacy_setting ?? updates?.profile_visibility;

  if (resolved != null) {
    const normalized = resolveUserProfileVisibility({ privacy_setting: resolved });
    next.privacy_setting = normalized;
    next.profile_visibility = normalized;
  }

  return next;
}
