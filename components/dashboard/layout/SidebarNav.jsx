"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/core/contexts/AuthContext";
import { useChat } from "@/core/contexts/ChatContext";
import { 
  MdHome, 
  MdFavoriteBorder, 
  MdChatBubbleOutline, 
  MdGroups,
  MdPeopleAlt,
  MdAssignment
} from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";

const NAV_ITEMS = {
  DISCOVER: { icon: MdHome, label: "Discover", path: "/dashboard", public: true },
  MY_LISTINGS: { icon: FaRegEdit, label: "My Listings", path: "/my-properties" },
  INTERESTS: { icon: MdAssignment, label: "My Interests", path: "/interests" },
  SAVED: { icon: MdFavoriteBorder, label: "Saved", path: "/saved" },
  FIND_PEOPLE: { icon: MdPeopleAlt, label: "Find People", path: "/find-people" },
  MESSAGES: { icon: MdChatBubbleOutline, label: "Messages", path: "/messages", badge: true },
  BUDDY_UP: { icon: MdGroups, label: "Buddy-Up", path: "/dashboard/buddy" },
  COMMUNITY: { icon: MdGroups, label: "Community", path: "/dashboard/community" }
};

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthContext();
  const { unreadCount: chatUnreadCount } = useChat();

  const getNavItems = () => {
    const items = [NAV_ITEMS.DISCOVER];
    if (user) {
      items.push(
        NAV_ITEMS.MY_LISTINGS,
        NAV_ITEMS.INTERESTS,
        NAV_ITEMS.SAVED,
        NAV_ITEMS.FIND_PEOPLE,
        NAV_ITEMS.MESSAGES,
        NAV_ITEMS.BUDDY_UP,
        NAV_ITEMS.COMMUNITY
      );
    }
    return items;
  };

  const isActive = (path) => pathname === path;

  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-white border-r border-navy-200 h-[calc(100vh-73px)] sticky top-[73px] z-30">
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        {getNavItems().map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          const badgeCount = item.badge && chatUnreadCount > 0 ? chatUnreadCount : null;
          
          return (
            <button
              key={item.label}
              onClick={() => router.push(user ? item.path : '/rooms')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium text-sm text-left relative group ${
                active 
                  ? "bg-navy-950 text-white shadow-md shadow-navy-950/20" 
                  : "text-navy-600 hover:bg-navy-50 hover:text-navy-950"
              }`}
            >
              <Icon size={22} className={active ? "text-terracotta-400" : "text-navy-400 group-hover:text-navy-600"} />
              <span className="flex-1 font-sans">{item.label}</span>
              
              {badgeCount && (
                <span className="bg-terracotta-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-navy-100 m-4 rounded-2xl bg-navy-50">
         <p className="text-xs text-navy-500 font-medium mb-1">Need help?</p>
         <a href="/support" className="text-sm font-bold text-navy-800 hover:text-terracotta-500 transition-colors">Contact Support</a>
      </div>
    </aside>
  );
}
