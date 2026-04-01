import { beforeEach, describe, expect, test, vi } from 'vitest';

const notifySuperadminsMock = vi.fn();

vi.mock('../../core/services/superadmin/superadmin-notifications.js', () => ({
  notifySuperadmins: notifySuperadminsMock,
}));

describe('notifySuperadminsOfPendingProperty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifySuperadminsMock.mockResolvedValue({ notified: 2, failed: 0 });
  });

  test('builds and forwards the pending-property notification payload', async () => {
    const { notifySuperadminsOfPendingProperty } = await import(
      '../../core/services/properties/property-approval-notifications.js'
    );

    const result = await notifySuperadminsOfPendingProperty({
      property: { id: 'property-1', title: 'Bright ensuite room', city: 'Dublin', state: 'Leinster' },
      creatorUserId: 'creator-1',
      creatorName: 'Ada',
    });

    expect(notifySuperadminsMock).toHaveBeenCalledWith({
      actorUserId: 'creator-1',
      type: 'system',
      title: 'New Property Pending Approval',
      message: 'Ada submitted "Bright ensuite room" in Dublin, Leinster for approval.',
      link: '/superadmin/properties?approvalStatus=pending',
      data: { propertyId: 'property-1', approvalStatus: 'pending' },
      channels: ['in-app', 'email'],
    });
    expect(result).toEqual({ notified: 2, failed: 0 });
  });

  test('skips immediately when property id is missing', async () => {
    const { notifySuperadminsOfPendingProperty } = await import(
      '../../core/services/properties/property-approval-notifications.js'
    );

    const result = await notifySuperadminsOfPendingProperty({
      property: { title: 'Studio' },
      creatorUserId: 'creator-1',
      creatorName: 'Owner',
    });

    expect(notifySuperadminsMock).not.toHaveBeenCalled();
    expect(result).toEqual({ notified: 0, skipped: true });
  });
});
