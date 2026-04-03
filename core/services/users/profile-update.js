const NULLABLE_EMPTY_STRING_FIELDS = new Set([
  'phone_number',
  'bio',
  'date_of_birth',
  'gender',
  'profile_picture',
]);

export function normalizeUserProfileUpdates(updates = {}) {
  const next = { ...updates };

  for (const field of NULLABLE_EMPTY_STRING_FIELDS) {
    if (next[field] === '') {
      next[field] = null;
    }
  }

  return next;
}
