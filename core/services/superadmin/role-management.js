export function validateSuperadminRoleChange({
  actorUserId,
  targetUserId,
  currentIsSuperadmin,
  nextIsSuperadmin,
  currentSuperadminCount = null,
}) {
  if (typeof nextIsSuperadmin !== 'boolean') {
    return { valid: false, status: 400, error: 'isSuperAdmin must be a boolean.' };
  }

  if (!nextIsSuperadmin && targetUserId === actorUserId) {
    return {
      valid: false,
      status: 400,
      error: 'You cannot remove your own superadmin access.',
    };
  }

  if (!nextIsSuperadmin && currentIsSuperadmin && Number(currentSuperadminCount || 0) <= 1) {
    return {
      valid: false,
      status: 400,
      error: 'Cannot revoke the last superadmin account.',
    };
  }

  return { valid: true };
}

