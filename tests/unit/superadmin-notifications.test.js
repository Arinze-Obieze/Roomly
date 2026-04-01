import { beforeEach, describe, expect, test, vi } from 'vitest';

const sendMock = vi.fn();
const eqMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock('../../core/services/notifications/notifier.js', () => ({
  Notifier: {
    send: sendMock,
  },
}));

vi.mock('../../core/utils/supabase/admin.js', () => ({
  createAdminClient: createAdminClientMock,
}));

describe('notifySuperadmins', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    eqMock.mockResolvedValue({ data: [], error: null });
    selectMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });
    createAdminClientMock.mockReturnValue({ from: fromMock });
    sendMock.mockResolvedValue({ inApp: true, email: true });
  });

  test('notifies each superadmin except the actor', async () => {
    eqMock.mockResolvedValue({
      data: [{ id: 'admin-1' }, { id: 'actor-1' }, { id: 'admin-2' }],
      error: null,
    });

    const { notifySuperadmins } = await import('../../core/services/superadmin/superadmin-notifications.js');

    const result = await notifySuperadmins({
      actorUserId: 'actor-1',
      type: 'system',
      title: 'New Support Ticket',
      message: 'Ada opened a support ticket: "Payments issue"',
      link: '/superadmin/support',
      data: { ticketId: 'ticket-1', category: 'billing' },
      channels: ['in-app', 'email'],
    });

    expect(fromMock).toHaveBeenCalledWith('users');
    expect(selectMock).toHaveBeenCalledWith('id');
    expect(eqMock).toHaveBeenCalledWith('is_superadmin', true);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenCalledWith({
      userId: 'admin-1',
      type: 'system',
      title: 'New Support Ticket',
      message: 'Ada opened a support ticket: "Payments issue"',
      link: '/superadmin/support',
      data: { ticketId: 'ticket-1', category: 'billing' },
      channels: ['in-app', 'email'],
    });
    expect(sendMock).toHaveBeenCalledWith({
      userId: 'admin-2',
      type: 'system',
      title: 'New Support Ticket',
      message: 'Ada opened a support ticket: "Payments issue"',
      link: '/superadmin/support',
      data: { ticketId: 'ticket-1', category: 'billing' },
      channels: ['in-app', 'email'],
    });
    expect(result).toEqual({ notified: 2, failed: 0 });
  });

  test('skips notification when no other superadmins are available', async () => {
    eqMock.mockResolvedValue({
      data: [{ id: 'actor-1' }],
      error: null,
    });

    const { notifySuperadmins } = await import('../../core/services/superadmin/superadmin-notifications.js');

    const result = await notifySuperadmins({
      actorUserId: 'actor-1',
      title: 'New Support Ticket',
      message: 'Test',
    });

    expect(sendMock).not.toHaveBeenCalled();
    expect(result).toEqual({ notified: 0, skipped: true });
  });
});
