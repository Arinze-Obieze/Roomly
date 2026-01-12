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
  MdAddCircleOutline
} from "react-icons/md";
import { HeaderNavItem } from "@/components/dashboard/ui/HeaderNavItem";
import { useAuthContext } from "@/contexts/AuthContext";

export const Header = ({ activeTab, setActiveTab, showFilters, setShowFilters }) => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [isScrolled, setIsScrolled] = useState(false);

  // Get first name safely
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  const avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url;
  const initialsFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=random`;

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
            <button 
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <img 
                src={avatarUrl || initialsFallback} 
                className="w-8 h-8 rounded-full border border-slate-200 object-cover" 
                alt="User" 
              />
              <span className="text-sm font-medium text-slate-700">{firstName}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-3 bg-slate-50/50">
          <nav className="flex items-center gap-1">
            <HeaderNavItem 
              icon={MdHome} 
              label="Discover" 
              active={activeTab === "discover"}
              onClick={() => setActiveTab("discover")}
            />
            <HeaderNavItem 
              icon={MdHome} 
              label="My Listings" 
              active={false} // Since this is a direct link, active state management might need refactor if we want it to highlight. Simple link for now.
              onClick={() => router.push('/my-properties')}
            />
            <HeaderNavItem 
              icon={MdFavoriteBorder} 
              label="Saved" 
              active={activeTab === "saved"}
              onClick={() => setActiveTab("saved")}
            />
            <HeaderNavItem 
              icon={MdChatBubbleOutline} 
              label="Messages" 
              badge="3"
              active={activeTab === "messages"}
              onClick={() => setActiveTab("messages")}
            />
            <HeaderNavItem 
              icon={MdGroups} 
              label="Community" 
              active={activeTab === "community"}
              onClick={() => setActiveTab("community")}
            />
          </nav>

          <div className="relative w-96">
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
            <button 
              onClick={() => router.push('/profile')}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <MdPersonOutline size={22} />
            </button>
          </div>
        </div>

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
      </header>
    </>
  );
};