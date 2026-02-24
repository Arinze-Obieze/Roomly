'use client';

import { useNotifications } from '@/core/contexts/NotificationsContext';
import NotificationList from '@/components/dashboard/notifications/NotificationList';

export default function NotificationsPage() {
  const { unreadCount } = useNotifications();

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-navy-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100">
          <h1 className="text-xl font-heading font-bold text-navy-950">
            Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
          </h1>
        </div>
        <NotificationList onClose={() => {}} />
      </div>
    </main>
  );
}
