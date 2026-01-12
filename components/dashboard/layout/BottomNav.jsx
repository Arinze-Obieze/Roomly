"use client";

import { useRouter } from "next/navigation";
import { 
  MdHome, 
  MdFavoriteBorder, 
  MdChatBubbleOutline, 
  MdGroups, 
  MdAddCircleOutline,
  MdForum 
} from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";

import { BottomNavItem } from "../ui/BottomNavItem";

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 py-3 px-2">
      <div className="flex justify-around items-center">
        <BottomNavItem
          icon={MdHome}
          label="Discover"
          active={activeTab === "discover"}
          onClick={() => setActiveTab("discover")}
        />
        <BottomNavItem
          icon={MdFavoriteBorder}
          label="Saved"
          active={activeTab === "saved"}
          onClick={() => setActiveTab("saved")}
        />
        <BottomNavItem
          icon={FaRegEdit}
          label="Manage Listings"
          active={false}
          onClick={() => router.push('/my-properties')}
        />
        <BottomNavItem
          icon={MdAddCircleOutline}
          label="List"
          active={activeTab === "list"}
          onClick={() => router.push('/listings/new')}
        />
        <BottomNavItem
          icon={MdChatBubbleOutline}
          label="Chat"
          badge="3"
          active={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
        />
        <BottomNavItem 
          icon={MdForum} 
          label="Community" 
          active={activeTab === "community"}
          onClick={() => router.push('/community')}
        />
      </div>
    </nav>
  );
};