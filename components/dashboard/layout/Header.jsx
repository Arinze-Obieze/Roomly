"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { 
  MdHome, 
  MdFavoriteBorder, 
  MdChatBubbleOutline, 
  MdGroups,
  MdNotificationsNone,
  MdPersonOutline,
  MdSearch,
  MdAddCircleOutline,
  MdLogout,
  MdKeyboardArrowDown,
  MdPeopleAlt
} from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { HeaderNavItem } from "@/components/dashboard/ui/HeaderNavItem"; // we just redesigned this
import { useAuthContext } from "@/core/contexts/AuthContext";
import { useChat } from "@/core/contexts/ChatContext";
import { useFilters } from "@/components/dashboard/filters/useFilters";
import { useNotifications } from "@/core/contexts/NotificationsContext";
import NotificationList from "../notifications/NotificationList";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

// ========== CONSTANTS (unchanged) ==========
const NAV_ITEMS = {
  DISCOVER: { icon: MdHome, label: "Discover", path: "/dashboard", public: true },
  MY_LISTINGS: { icon: FaRegEdit, label: "My Listings", path: "/my-properties" },
  SAVED: { icon: MdFavoriteBorder, label: "Saved", path: "/saved" },
  FIND_PEOPLE: { icon: MdPeopleAlt, label: "Find People", path: "/find-people" },
  MESSAGES: { icon: MdChatBubbleOutline, label: "Messages", path: "/messages", badge: true },
  COMMUNITY: { icon: MdGroups, label: "Community", path: "/dashboard/community" }
};

const DROPDOWN_MENU_ITEMS = [
  { label: "Profile", icon: MdPersonOutline, path: "/profile", color: "text-[#020617]", hoverColor: "hover:bg-[#F0F4F8]" },
  { label: "Log Out", icon: MdLogout, onClick: "logout", color: "text-[#FF6B6B]", hoverColor: "hover:bg-[#FF6B6B10]" }
];

// ========== SUB-COMPONENTS (restyled with brand) ==========
const Logo = () => (
  <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer">
    <Image width={40} height={40} alt="RoomFind" src="/logo/logo.svg" />
    {/* Optional: add brand dot next to logo? Already in SVG perhaps */}
  </Link>
);

const NotificationsButton = ({ isMobile = false, onClick, unreadCount }) => (
  <button 
    onClick={onClick}
    className="relative p-2 rounded-xl hover:bg-[#F0F4F8] transition-colors group"
  >
    <MdNotificationsNone size={22} className="text-[#627D98] group-hover:text-[#020617]" />
    {unreadCount > 0 && (
      <span className={`absolute ${isMobile ? "-top-1 -right-1" : "top-1.5 right-1.5"} w-4 h-4 bg-[#4ECDC4] rounded-full text-[9px] text-white flex items-center justify-center font-bold border border-white shadow-sm`}>
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
);

const UserAvatar = ({ user, size = "w-8 h-8", showName = true }) => {
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  const avatarUrl = user?.profile_picture || user?.avatar_url || user?.user_metadata?.avatar_url;
  
  if (avatarUrl) {
    return <img src={avatarUrl} className={`${size} rounded-full border-2 border-[#F0F4F8] object-cover`} alt="User" />;
  }
  
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  return (
    <div className={`${size} rounded-full bg-[#FF6B6B20] text-primary border-2 border-[#FF6B6B40] flex items-center justify-center text-xs font-bold`}>
      {initials}
    </div>
  );
};

const DropdownMenu = ({ isOpen, onItemClick, onLogout }) => (
  isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-lg border border-[#BCCCDC] py-1 overflow-hidden z-[260]"
    >
      {DROPDOWN_MENU_ITEMS.map((item, index) => (
        <div key={item.label}>
          {index > 0 && <div className="h-px bg-[#F0F4F8] my-1" />}
          <button
            onClick={() => item.onClick === "logout" ? onLogout() : onItemClick(item.path)}
            className={`w-full text-left px-4 py-3 text-sm ${item.color} ${item.hoverColor} flex items-center gap-2 transition-colors`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        </div>
      ))}
    </motion.div>
  )
);

const SearchBar = ({ placeholder = "Search properties...", value, onChange }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <MdSearch className="text-[#627D98] text-xl" />
    </div>
    <input 
      type="text" 
      placeholder={placeholder} 
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      className="w-full pl-11 pr-4 py-3 bg-white border border-[#BCCCDC] rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none placeholder:text-[#627D98] text-[#020617]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    />
  </div>
);

const MobileSearchBar = ({ placeholder = "Search properties...", value, onChange }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <MdSearch className="text-[#627D98] text-xl" />
    </div>
    <input 
      type="text" 
      placeholder={placeholder} 
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-3 bg-white border border-[#BCCCDC] rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-sm placeholder:text-[#627D98] text-[#020617]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    />
  </div>
);

const AuthButtons = () => (
  <div className="flex items-center gap-3">
    <Link 
      href="/login" 
      className="text-sm font-semibold text-[#627D98] hover:text-[#020617] transition-colors"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      Log In
    </Link>
    <Link 
      href="/signup" 
      className="bg-primary hover:bg-[#e05a5a] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-[#FF6B6B40] active:scale-95"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      Sign Up
    </Link>
  </div>
);

const ListPropertyButton = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-[#e05a5a] shadow-lg shadow-[#FF6B6B40] transition-all active:scale-[0.98]"
    style={{ fontFamily: 'Inter, sans-serif' }}
  >
    <MdAddCircleOutline size={20} />
    List Property
  </button>
);

// ========== MAIN HEADER ==========
export const Header = ({ showFilters, setShowFilters }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, loading } = useAuthContext();
  const { unreadCount: chatUnreadCount } = useChat();
  const { unreadCount: notifUnreadCount } = useNotifications();
  const { filters, updateFilters } = useFilters();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const showSearchAndFilters = pathname === '/dashboard';
  const isActive = (path) => pathname === path;

  const firstName = user?.full_name?.split(' ')[0] || 'User';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getNavItems = () => {
    const items = [NAV_ITEMS.DISCOVER];
    if (user) {
      items.push(
        NAV_ITEMS.MY_LISTINGS,
        NAV_ITEMS.SAVED,
        NAV_ITEMS.FIND_PEOPLE,
        NAV_ITEMS.MESSAGES,
        NAV_ITEMS.COMMUNITY
      );
    }
    return items;
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:block sticky top-0 z-40 bg-white border-b border-[#BCCCDC]">
        {/* Top Bar */}
        <div className="border-b border-[#F0F4F8] bg-white relative z-50">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4 max-w-[1920px] mx-auto">
                <Logo />
                
                <div className="flex items-center gap-4">
                    {loading ? (
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-[#F0F4F8] rounded-xl animate-pulse"></div>
                        <div className="w-32 h-8 bg-[#F0F4F8] rounded-xl animate-pulse"></div>
                    </div>
                    ) : user ? (
                    <>
                        <button 
                        onClick={() => router.push('/saved')}
                        className="p-2 rounded-xl hover:bg-[#F0F4F8] transition-colors group"
                        title="Saved Properties"
                        >
                        <MdFavoriteBorder size={22} className="text-[#627D98] group-hover:text-primary" />
                        </button>

                        <div className="relative">
                        <NotificationsButton 
                            unreadCount={notifUnreadCount} 
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        />
                        {isNotificationsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#BCCCDC] overflow-hidden z-60 animate-in fade-in zoom-in-95 duration-200">
                            <NotificationList onClose={() => setIsNotificationsOpen(false)} />
                            </div>
                        )}
                        </div>

                        <div className="relative">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#F0F4F8] transition-colors"
                        >
                            <UserAvatar user={user} />
                            <span className="text-sm font-medium text-[#020617]" style={{ fontFamily: 'Inter, sans-serif' }}>{firstName}</span>
                            <MdKeyboardArrowDown 
                            size={20} 
                            className={`text-[#627D98] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        <DropdownMenu 
                            isOpen={isDropdownOpen}
                            onItemClick={(path) => router.push(path)}
                            onLogout={handleLogout}
                        />
                        </div>
                    </>
                    ) : (
                    <AuthButtons />
                    )}
                </div>
            </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-[#F0F4F8]">
            <div className="flex items-center justify-between px-4 lg:px-8 py-3 max-w-[1920px] mx-auto">
                <nav className="flex items-center gap-1">
                    {getNavItems().map((item) => (
                    <HeaderNavItem 
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        active={isActive(item.path)}
                        badge={item.badge && chatUnreadCount > 0 ? chatUnreadCount : null}
                        onClick={() => router.push(user ? item.path : '/rooms')}
                    />
                    ))}
                </nav>

                <div className="relative w-96">
                    {showSearchAndFilters && (
                    <SearchBar 
                        value={filters.searchQuery}
                        onChange={(val) => updateFilters({ searchQuery: val })}
                    />
                    )}
                </div>

                <ListPropertyButton onClick={() => router.push('/listings/new')} />
            </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className={`lg:hidden sticky top-0 z-[220] bg-white/80 backdrop-blur-md border-b border-[#BCCCDC] transition-shadow ${isScrolled ? 'shadow-sm' : ''}`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 bg-[#F0F4F8] rounded-full animate-pulse"></div>
            ) : user ? (
              <>
                <button 
                  onClick={() => router.push('/saved')}
                  className="p-2 rounded-xl hover:bg-[#F0F4F8] text-[#627D98]"
                >
                  <MdFavoriteBorder size={22} />
                </button>

                <div className="relative">
                  <NotificationsButton 
                    isMobile 
                    unreadCount={notifUnreadCount}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  />
                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#BCCCDC] overflow-hidden z-60 animate-in fade-in zoom-in-95 duration-200">
                      <NotificationList onClose={() => setIsNotificationsOpen(false)} />
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    className="p-2 rounded-xl hover:bg-[#F0F4F8] flex items-center gap-1"
                  >
                    <MdPersonOutline size={22} className="text-[#627D98]" />
                    <MdKeyboardArrowDown 
                      size={16} 
                      className={`text-[#627D98] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <DropdownMenu 
                    isOpen={isDropdownOpen}
                    onItemClick={(path) => router.push(path)}
                    onLogout={handleLogout}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-semibold text-[#627D98] hover:text-[#020617]">Log In</Link>
                <Link href="/signup" className="text-sm font-bold text-primary">Sign Up</Link>
              </div>
            )}
          </div>
        </div>

        {showSearchAndFilters && (
          <div className="px-4 pb-4">
            <MobileSearchBar 
              value={filters.searchQuery}
              onChange={(val) => updateFilters({ searchQuery: val })}
            />
          </div>
        )}
      </header>
    </>
  );
};
