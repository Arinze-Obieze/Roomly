"use client";

import { useNotifications } from "@/contexts/NotificationsContext";
import NotificationItem from "./NotificationItem";
import { MdDoneAll, MdNotificationsNone } from "react-icons/md";

export default function NotificationList({ onClose }) {
  const { notifications, markAllAsRead, loading } = useNotifications();

  if (loading) {
      return <div className="p-8 text-center text-slate-400 text-xs">Loading...</div>;
  }

  return (
    <div className="flex flex-col max-h-[400px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="font-bold text-slate-800">Notifications</h3>
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

      <div className="overflow-y-auto flex-1">
        {notifications.length > 0 ? (
            notifications.map(notification => (
                <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onClose={onClose}
                />
            ))
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
