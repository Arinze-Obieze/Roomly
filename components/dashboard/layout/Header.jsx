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
  MdFilterList,
  MdSearch,
  MdAddCircleOutline,
  MdLogout,
  MdKeyboardArrowDown,
  MdFavorite
} from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { HeaderNavItem } from "@/components/dashboard/ui/HeaderNavItem";
import { useAuthContext } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import Link from "next/link";

// ========== EXTRACTED CONSTANTS ==========
const NAV_ITEMS = {
  DISCOVER: {
    icon: MdHome,
    label: "Discover",
    path: "/dashboard",
    public: true
  },
  MY_LISTINGS: {
    icon: FaRegEdit,
    label: "My Listings",
    path: "/my-properties"
  },
  SAVED: {
    icon: MdFavoriteBorder,
    label: "Saved",
    path: "/saved"
  },
  INTERESTS: {
    icon: MdFavorite,
    label: "Interests",
    path: "/interests"
  },
  MESSAGES: {
    icon: MdChatBubbleOutline,
    label: "Messages",
    path: "/messages",
    badge: true
  },
  COMMUNITY: {
    icon: MdGroups,
    label: "Community",
    path: "/community"
  }
};

const DROPDOWN_MENU_ITEMS = [
  {
    label: "Profile",
    icon: MdPersonOutline,
    path: "/profile",
    color: "text-slate-700",
    hoverColor: "hover:bg-slate-50"
  },
  {
    label: "Log Out",
    icon: MdLogout,
    onClick: "logout",
    color: "text-red-600",
    hoverColor: "hover:bg-red-50"
  }
];

const BRAND_CONFIG = {
  name: "HomeShareIE",
  logo: {
    gradient: "from-cyan-500 to-indigo-500",
    size: "w-8 h-8"
  }
};

// ========== EXTRACTED COMPONENTS ==========
const Logo = () => (
  <div className="flex items-center gap-3">
    <div className={`${BRAND_CONFIG.logo.size} bg-linear-to-tr ${BRAND_CONFIG.logo.gradient} rounded-lg`} />
    <h1 className="text-xl font-bold">{BRAND_CONFIG.name}</h1>
  </div>
);

const NotificationsButton = ({ isMobile = false }) => (
  <button className={`relative p-2 hover:bg-slate-100 rounded-lg transition-colors ${isMobile ? "" : ""}`}>
    <MdNotificationsNone size={22} className="text-slate-600" />
    <span className={`absolute ${isMobile ? "-top-1 -right-1" : "top-1.5 right-1.5"} w-2 h-2 bg-red-500 rounded-full`} />
  </button>
);

const UserAvatar = ({ user, size = "w-8 h-8", showName = true }) => {
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  // Check profile_picture (from public.users) first, then avatar_url (auth meta)
  const avatarUrl = user?.profile_picture || user?.avatar_url || user?.user_metadata?.avatar_url;
  
  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        className={`${size} rounded-full border border-slate-200 object-cover`} 
        alt="User" 
      />
    );
  }
  
  const initials = user?.full_name?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';
    
  return (
    <div className={`${size} rounded-full bg-cyan-100 text-cyan-700 border border-slate-200 flex items-center justify-center text-xs font-bold`}>
      {initials}
    </div>
  );
};

const DropdownMenu = ({ isOpen, onItemClick, onLogout }) => (
  isOpen && (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-[60]">
      {DROPDOWN_MENU_ITEMS.map((item, index) => (
        <div key={item.label}>
          {index > 0 && <div className="h-px bg-slate-100 my-1" />}
          <button
            onClick={() => item.onClick === "logout" ? onLogout() : onItemClick(item.path)}
            className={`w-full text-left px-4 py-3 text-sm ${item.color} ${item.hoverColor} flex items-center gap-2 transition-colors`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
);

const SearchBar = ({ placeholder = "Search locations..." }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <MdSearch className="text-slate-400 text-xl" />
    </div>
    <input 
      type="text" 
      placeholder={placeholder} 
      className="w-full pl-11 pr-24 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
    />
  </div>
);

const MobileSearchBar = ({ placeholder = "Search locations..." }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <MdSearch className="text-slate-400 text-xl" />
    </div>
    <input 
      type="text" 
      placeholder={placeholder} 
      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none text-sm"
    />
  </div>
);

const AuthButtons = () => (
  <div className="flex items-center gap-3">
    <Link 
      href="/login" 
      className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
    >
      Log In
    </Link>
    <Link 
      href="/signup" 
      className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
    >
      Sign Up
    </Link>
  </div>
);

const ListPropertyButton = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="bg-linear-to-r from-cyan-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-200 transition-all active:scale-[0.98]"
  >
    <MdAddCircleOutline size={20} />
    List Property
  </button>
);

// ========== MAIN COMPONENT ==========
export const Header = ({ showFilters, setShowFilters }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, loading } = useAuthContext(); // Added loading
  const { unreadCount } = useChat();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ... (unchanged code) ...

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };
  
  const showSearchAndFilters = pathname === '/dashboard';
  const isActive = (path) => pathname === path;

  // Get user info
  const firstName = user?.full_name?.split(' ')[0] || 'User';

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items for the current user
  const getNavItems = () => {
    const items = [NAV_ITEMS.DISCOVER];
    
    if (user) {
      items.push(
        NAV_ITEMS.MY_LISTINGS,
        NAV_ITEMS.SAVED,
        NAV_ITEMS.INTERESTS,
        NAV_ITEMS.MESSAGES,
        NAV_ITEMS.COMMUNITY
      );
    }
    
    return items;
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:block sticky top-0 z-40 bg-white border-b border-slate-200">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 relative z-50">
          <Logo />
          
          <div className="flex items-center gap-4">
            {loading ? (
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="w-32 h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                </div>
            ) : user ? (
              <>
                 {/* Saved Button (New) */}
                <button 
                  onClick={() => router.push('/saved')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative group"
                  title="Saved Properties"
                >
                  <MdFavoriteBorder size={22} className="text-slate-600 group-hover:text-red-500 transition-colors" />
                </button>

                <NotificationsButton />
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <UserAvatar user={user} />
                    <span className="text-sm font-medium text-slate-700">{firstName}</span>
                    <MdKeyboardArrowDown 
                      size={20} 
                      className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
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

        {/* Navigation Bar */}
        <div className="flex items-center justify-between px-8 py-3 bg-slate-50/50">
          <nav className="flex items-center gap-1">
            {getNavItems().map((item) => (
              <HeaderNavItem 
                key={item.label}
                icon={item.icon}
                label={item.label}
                active={isActive(item.path)}
                badge={item.badge && unreadCount > 0 ? unreadCount : null}
                onClick={() => router.push(user ? item.path : '/rooms')}
              />
            ))}
          </nav>

          <div className="relative w-96">
            {showSearchAndFilters && <SearchBar />}
          </div>

          <ListPropertyButton onClick={() => router.push('/listings/new')} />
        </div>
      </header>

      {/* Mobile Header */}
      <header className={`lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-shadow ${isScrolled ? 'shadow-sm' : ''}`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center gap-2">
            {loading ? (
                <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse"></div>
            ) : user ? (
              <>
                 {/* Saved Button (New - Mobile) */}
                <button 
                  onClick={() => router.push('/saved')}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                >
                  <MdFavoriteBorder size={22} />
                </button>

                <NotificationsButton isMobile />
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    className="p-2 rounded-lg hover:bg-slate-100 flex items-center gap-1"
                  >
                    <MdPersonOutline size={22} />
                    <MdKeyboardArrowDown 
                      size={16} 
                      className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
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
                <Link href="/login" className="text-sm font-semibold text-slate-600">Log In</Link>
                <Link href="/signup" className="text-sm font-bold text-cyan-600">Sign Up</Link>
              </div>
            )}
          </div>
        </div>

        {showSearchAndFilters && (
          <div className="px-4 pb-4">
            <MobileSearchBar />
          </div>
        )}
      </header>
    </>
  );
};