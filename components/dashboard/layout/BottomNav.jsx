import { useRouter, usePathname } from "next/navigation";
import { 
  MdHome, 
  MdFavoriteBorder, 
  MdChatBubbleOutline,
  MdPersonOutline,
  MdStorefront,
  MdGroups
} from "react-icons/md";
import { useChat } from "@/contexts/ChatContext";

import { BottomNavItem } from "../ui/BottomNavItem";
import { FaRegEdit } from "react-icons/fa";

export const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useChat();

  // Helper to determine active state
  const isActive = (path) => pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg border-t border-slate-200 py-3 px-2 shadow-lg-up safe-area-bottom">
      <div className="flex justify-around items-end">
        <BottomNavItem
          icon={MdHome}
          label="Discover"
          active={isActive('/dashboard')}
          onClick={() => router.push('/dashboard')}
        />
        <BottomNavItem
          icon={MdGroups}
          label="Buddy-Up"
          active={pathname?.startsWith('/dashboard/buddy')}
          onClick={() => router.push('/dashboard/buddy')}
        />
        
        {/* Middle Highlighted Tab: Manage Listings */}
         <button
          onClick={() => router.push('/my-properties')}
          className="relative -top-6 group"
        >
          <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg border-4 border-white transition-all active:scale-95 ${
            isActive('/my-properties') 
              ? 'bg-slate-900 text-white' 
              : 'bg-cyan-600 text-white hover:bg-cyan-700'
          }`}>
            <FaRegEdit size={20} />
          </div>
          <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap ${
            isActive('/my-properties') ? 'text-slate-900' : 'text-slate-500'
          }`}>
            Listings
          </span>
        </button>

        <BottomNavItem
          icon={MdChatBubbleOutline}
          label="Messages"
          badge={unreadCount > 0 ? unreadCount : null}
          active={isActive('/messages')}
          onClick={() => router.push('/messages')}
        />
        <BottomNavItem
          icon={MdPersonOutline}
          label="Profile"
          active={isActive('/profile')}
          onClick={() => router.push('/profile')}
        />
      </div>
    </nav>
  );
};