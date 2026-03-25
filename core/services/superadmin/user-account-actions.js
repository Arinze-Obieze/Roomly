export function validateUserAccountAction({
  action,
  actorUserId,
  targetUserId,
  targetIsSuperadmin,
  currentSuperadminCount = null,
}) {
  if (!['suspend', 'unsuspend', 'delete'].includes(action)) {
    return { valid: false, status: 400, error: 'Invalid account action.' };
  }

  if (targetUserId === actorUserId && action !== 'unsuspend') {
    return {
      valid: false,
      status: 400,
      error: `You cannot ${action} your own account.`,
    };
  }

  if (
    ['suspend', 'delete'].includes(action) &&
    targetIsSuperadmin &&
    Number(currentSuperadminCount || 0) <= 1
  ) {
    return {
      valid: false,
      status: 400,
      error: `Cannot ${action} the last superadmin account.`,
    };
  }

  return { valid: true };
}

