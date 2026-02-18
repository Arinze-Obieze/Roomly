"use client";

import { useNotifications } from "@/core/contexts/NotificationsContext";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { 
  MdChatBubble, 
  MdHome, 
  MdNotifications, 
  MdSecurity, 
  MdInfo 
} from "react-icons/md";

const ICONS = {
  message: MdChatBubble,
  inquiry: MdHome,
  match: MdHome,
  system: MdInfo,
  security: MdSecurity
};

const COLORS = {
  message: "text-blue-500 bg-blue-50",
  inquiry: "text-terracotta-500 bg-terracotta-50",
  match: "text-green-500 bg-green-50",
  system: "text-slate-500 bg-slate-50",
  security: "text-red-500 bg-red-50"
};

export default function NotificationItem({ notification, onClose }) {
  const { markAsRead } = useNotifications();
  const router = useRouter();

  const Icon = ICONS[notification.type] || MdNotifications;
  const colorClass = COLORS[notification.type] || COLORS.system;

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      if (onClose) onClose();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
            <h4 className={`text-sm font-semibold truncate ${!notification.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                {notification.title}
            </h4>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
            {notification.message}
        </p>
      </div>

      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-terracotta-500 mt-2 shrink-0" />
      )}
    </div>
  );
}
