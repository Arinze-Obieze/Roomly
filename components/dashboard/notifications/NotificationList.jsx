"use client";

import { useNotifications } from "@/core/contexts/NotificationsContext";
import NotificationItem from "./NotificationItem";
import { MdDoneAll, MdNotificationsNone, MdRefresh } from "react-icons/md";
import { useMemo, useState } from "react";

export default function NotificationList({ onClose }) {
  const {
    notifications,
    markAllAsRead,
    loading,
    hasMore,
    loadMore,
    isFetchingMore,
    soundEnabled,
    toastEnabled,
    updatePreferences,
    refresh,
  } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return notifications.filter((notification) => !notification.is_read);
    }
    return notifications;
  }, [activeFilter, notifications]);

  if (loading) {
      return <div className="p-8 text-center text-slate-400 text-xs">Loading...</div>;
  }

  return (
    <div className="flex flex-col max-h-[460px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="font-bold text-slate-800">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <MdRefresh size={14} />
            Refresh
          </button>
          {notifications.some(n => !n.is_read) && (
              <button 
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-terracotta-500 hover:text-terracotta-600 flex items-center gap-1"
              >
                  <MdDoneAll size={14} />
                  Mark all read
              </button>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              activeFilter === 'all' ? 'bg-terracotta-50 text-terracotta-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            All
            <span className="ml-1 text-[10px] text-slate-400">({notifications.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              activeFilter === 'unread' ? 'bg-terracotta-50 text-terracotta-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Unread
            <span className="ml-1 text-[10px] text-slate-400">
              ({notifications.filter((notification) => !notification.is_read).length})
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <label className="flex items-center gap-1 text-slate-500">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => updatePreferences({ sound: e.target.checked })}
              className="rounded border-slate-300 text-terracotta-500 focus:ring-terracotta-500"
            />
            Sound
          </label>
          <label className="flex items-center gap-1 text-slate-500">
            <input
              type="checkbox"
              checked={toastEnabled}
              onChange={(e) => updatePreferences({ toast: e.target.checked })}
              className="rounded border-slate-300 text-terracotta-500 focus:ring-terracotta-500"
            />
            Toast
          </label>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {filteredNotifications.length > 0 ? (
          <>
            {filteredNotifications.map(notification => (
                <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onClose={onClose}
                />
            ))}
            {activeFilter === 'all' && hasMore && (
              <div className="p-3 text-center border-t border-slate-100">
                <button
                  onClick={loadMore}
                  disabled={isFetchingMore}
                  className="text-xs font-semibold text-terracotta-500 hover:text-terracotta-600 disabled:opacity-60"
                >
                  {isFetchingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <MdNotificationsNone size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No notifications yet</p>
                <p className="text-xs mt-1">We'll notify you when something happens.</p>
            </div>
        )}
      </div>
    </div>
  );
}
