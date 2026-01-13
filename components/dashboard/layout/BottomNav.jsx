"use client";

import { useRouter, usePathname } from "next/navigation";
import { 
  MdHome, 
  MdFavoriteBorder, 
  MdChatBubbleOutline, 
  MdGroups, 
  MdAddCircleOutline,
} from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { useChat } from "@/contexts/ChatContext";

import { BottomNavItem } from "../ui/BottomNavItem";

export const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useChat();

  // Helper to determine active state
  const isActive = (path) => pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg border-t border-slate-200 py-3 px-2 shadow-lg-up">
      <div className="flex justify-around items-center">
        <BottomNavItem
          icon={MdHome}
          label="Discover"
          active={isActive('/dashboard')}
          onClick={() => router.push('/dashboard')}
        />
        <BottomNavItem
          icon={MdFavoriteBorder}
          label="Saved"
          active={isActive('/saved')}
          onClick={() => router.push('/saved')}
        />
        <BottomNavItem
          icon={FaRegEdit}
          label="Manage Listings"
          active={isActive('/my-properties')}
          onClick={() => router.push('/my-properties')}
        />
        {/* <BottomNavItem
          icon={MdAddCircleOutline}
          label="List"
          active={isActive('/listings/new')}
          onClick={() => router.push('/listings/new')}
        /> */}
        <BottomNavItem
          icon={MdChatBubbleOutline}
          label="Chat"
          badge={unreadCount > 0 ? unreadCount : null}
          active={isActive('/messages')}
          onClick={() => router.push('/messages')}
        />
        <BottomNavItem 
          icon={MdGroups} 
          label="Community" 
          active={isActive('/community')}
          onClick={() => router.push('/community')}
        />
      </div>
    </nav>
  );
};