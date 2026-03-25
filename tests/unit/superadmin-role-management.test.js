import { describe, expect, test } from 'vitest';
import { validateSuperadminRoleChange } from '../../core/services/superadmin/role-management.js';

describe('validateSuperadminRoleChange', () => {
  test('rejects non-boolean role updates', () => {
    expect(
      validateSuperadminRoleChange({
        actorUserId: 'admin-1',
        targetUserId: 'user-2',
        currentIsSuperadmin: false,
        nextIsSuperadmin: 'yes',
      })
    ).toEqual({
      valid: false,
      status: 400,
      error: 'isSuperAdmin must be a boolean.',
    });
  });

  test('rejects self-revocation', () => {
    expect(
      validateSuperadminRoleChange({
        actorUserId: 'admin-1',
        targetUserId: 'admin-1',
        currentIsSuperadmin: true,
        nextIsSuperadmin: false,
        currentSuperadminCount: 2,
      })
    ).toEqual({
      valid: false,
      status: 400,
      error: 'You cannot remove your own superadmin access.',
    });
  });

  test('rejects revoking the last superadmin', () => {
    expect(
      validateSuperadminRoleChange({
        actorUserId: 'admin-1',
        targetUserId: 'admin-2',
        currentIsSuperadmin: true,
        nextIsSuperadmin: false,
        currentSuperadminCount: 1,
      })
    ).toEqual({
      valid: false,
      status: 400,
      error: 'Cannot revoke the last superadmin account.',
    });
  });

  test('allows safe grants and revocations', () => {
    expect(
      validateSuperadminRoleChange({
        actorUserId: 'admin-1',
        targetUserId: 'user-2',
        currentIsSuperadmin: false,
        nextIsSuperadmin: true,
      })
    ).toEqual({ valid: true });

    expect(
      validateSuperadminRoleChange({
        actorUserId: 'admin-1',
        targetUserId: 'admin-2',
        currentIsSuperadmin: true,
        nextIsSuperadmin: false,
        currentSuperadminCount: 2,
      })
    ).toEqual({ valid: true });
  });
});
