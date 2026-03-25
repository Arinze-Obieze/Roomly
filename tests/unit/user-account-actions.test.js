import { describe, expect, test } from 'vitest';
import { validateUserAccountAction } from '../../core/services/superadmin/user-account-actions.js';

describe('validateUserAccountAction', () => {
  test('rejects invalid actions', () => {
    expect(
      validateUserAccountAction({
        action: 'archive',
        actorUserId: 'admin-1',
        targetUserId: 'user-2',
        targetIsSuperadmin: false,
      })
    ).toEqual({
      valid: false,
      status: 400,
      error: 'Invalid account action.',
    });
  });

  test('prevents self suspension and deletion', () => {
    expect(
      validateUserAccountAction({
        action: 'suspend',
        actorUserId: 'admin-1',
        targetUserId: 'admin-1',
        targetIsSuperadmin: true,
        currentSuperadminCount: 2,
      })
    ).toEqual({
      valid: false,
      status: 400,
      error: 'You cannot suspend your own account.',
    });

    expect(
      validateUserAccountAction({
        action: 'delete',
        actorUserId: 'admin-1',
        targetUserId: 'admin-1',
        targetIsSuperadmin: true,
        currentSuperadminCount: 2,
      })
    ).toEqual({
      valid: false,
      status: 400,
      error: 'You cannot delete your own account.',
    });
  });

  test('protects the last superadmin from suspension or deletion', () => {
    expect(
      validateUserAccountAction({
        action: 'suspend',
        actorUserId: 'admin-1',
        targetUserId: 'admin-2',
        targetIsSuperadmin: true,
        currentSuperadminCount: 1,
      })
    ).toEqual({
      valid: false,
      status: 400,
      error: 'Cannot suspend the last superadmin account.',
    });

    expect(
      validateUserAccountAction({
        action: 'delete',
        actorUserId: 'admin-1',
        targetUserId: 'admin-2',
        targetIsSuperadmin: true,
        currentSuperadminCount: 1,
      })
    ).toEqual({
      valid: false,
      status: 400,
      error: 'Cannot delete the last superadmin account.',
    });
  });

  test('allows safe unsuspend and regular account actions', () => {
    expect(
      validateUserAccountAction({
        action: 'unsuspend',
        actorUserId: 'admin-1',
        targetUserId: 'user-2',
        targetIsSuperadmin: false,
      })
    ).toEqual({ valid: true });

    expect(
      validateUserAccountAction({
        action: 'suspend',
        actorUserId: 'admin-1',
        targetUserId: 'user-2',
        targetIsSuperadmin: false,
      })
    ).toEqual({ valid: true });
  });
});
