"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  MdLogout
} from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { HeaderNavItem } from "@/components/dashboard/ui/HeaderNavItem";
import { useAuthContext } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import Link from "next/link";

import { usePathname } from "next/navigation";

export const Header = ({ showFilters, setShowFilters }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuthContext();
  const { unreadCount } = useChat();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };
  
  const showSearchAndFilters = pathname === '/dashboard';
  const isActive = (path) => pathname === path;

  // Get first name safely
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  const avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url;


  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:block sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-tr from-cyan-500 to-indigo-500 rounded-lg"></div>
            <h1 className="text-xl font-bold">HomeShareIE</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MdNotificationsNone size={22} className="text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover" 
                      alt="User" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 border border-slate-200 flex items-center justify-center text-xs font-bold">
                      {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700">{firstName}</span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <button
                      onClick={() => router.push('/profile')}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <MdPersonOutline size={18} />
                      Profile
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <MdLogout size={18} />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-3 bg-slate-50/50">
          <nav className="flex items-center gap-1">
            <HeaderNavItem 
              icon={MdHome} 
              label="Discover" 
              active={isActive('/dashboard')}
              onClick={() => router.push('/dashboard')}
            />
            <HeaderNavItem 
              icon={FaRegEdit} 
              label="My Listings" 
              active={isActive('/my-properties')}
              onClick={() => router.push('/my-properties')}
            />
            <HeaderNavItem 
              icon={MdFavoriteBorder} 
              label="Saved" 
              active={isActive('/saved')}
              onClick={() => router.push('/saved')}
            />
            <HeaderNavItem 
              icon={MdChatBubbleOutline} 
              label="Messages" 
              badge={unreadCount > 0 ? unreadCount : null}
              active={isActive('/messages')}
              onClick={() => router.push('/messages')}
            />
            <HeaderNavItem 
              icon={MdGroups} 
              label="Community" 
              active={isActive('/community')}
              onClick={() => router.push('/community')}
            />
          </nav>

          <div className="relative w-96">
            {showSearchAndFilters && (
              <>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MdSearch className="text-slate-400 text-xl" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search locations..." 
                  className="w-full pl-11 pr-24 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
                />
                <button 
                  onClick={() => setShowFilters(true)}
                  className="absolute inset-y-2 right-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <MdFilterList /> Filters
                </button>
              </>
            )}
          </div>

          <button 
            onClick={() => router.push('/listings/new')}
            className="bg-linear-to-r from-cyan-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-200 transition-all active:scale-[0.98]"
          >
            <MdAddCircleOutline size={20} />
            List Property
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className={`lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-shadow ${isScrolled ? 'shadow-sm' : ''}`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-tr from-cyan-500 to-indigo-500 rounded-lg"></div>
            <h1 className="text-xl font-bold">HomeShareIE</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 relative">
              <MdNotificationsNone size={22} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <MdPersonOutline size={22} />
              </button>

              {/* Mobile Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <MdPersonOutline size={18} />
                    Profile
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <MdLogout size={18} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showSearchAndFilters && (
          <div className="px-4 pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdSearch className="text-slate-400 text-xl" />
              </div>
              
              <input 
                type="text" 
                placeholder="Search locations..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none text-sm"
              />

              <button 
                onClick={() => setShowFilters(true)}
                className="absolute inset-y-1 right-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <MdFilterList size={18} /> Filters
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};