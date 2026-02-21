'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  MdHome, 
  MdFavoriteBorder, 
  MdChatBubbleOutline, 
  MdGroups, 
  MdPersonOutline,
  MdSettings,
  MdHelpOutline,
  MdLogout,
  MdOutlinePolicy,
  MdOutlineSecurity,
  MdOutlineFeedback,
  MdNotificationsNone,
  MdVerified,
  MdChevronRight
} from 'react-icons/md';
import { FaRegEdit } from 'react-icons/fa';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { useChat } from '@/core/contexts/ChatContext';

export default function MenuPage() {
  const router = useRouter();
  const { signOut } = useAuthContext();
  const { unreadCount } = useChat();

  const handleNavigation = (path) => {
    router.push(path);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const nonMobileItems = [
    { icon: MdFavoriteBorder, label: 'Saved', path: '/saved', description: 'Your favorite properties' },
    { icon: MdNotificationsNone, label: 'Notifications', path: '/notifications', description: 'Stay updated on activity' }
  ];

  const supportItems = [
    { icon: MdHelpOutline, label: 'Help Center', path: '/help' },
    { icon: MdOutlineFeedback, label: 'Give Feedback', path: '/feedback' },
    { icon: MdOutlineSecurity, label: 'Safety Tips', path: '/safety' },
    { icon: MdOutlinePolicy, label: 'Terms & Privacy', path: '/legal' }
  ];

  const mobileMenuItems = [
    { icon: MdHome, label: 'Discover', path: '/dashboard', description: 'Find properties' },
    { icon: MdGroups, label: 'Buddy-Up', path: '/dashboard/buddy', description: 'Find flatmates' },
    { icon: FaRegEdit, label: 'My Listings', path: '/my-properties', description: 'Manage your properties' },
    { icon: MdChatBubbleOutline, label: 'Messages', path: '/messages', description: 'Your conversations', badge: unreadCount > 0 ? unreadCount : null }
  ];

  const MenuSection = ({ title, items }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {title && (
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
          {title}
        </h2>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50 mx-4">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavigation(item.path)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-primary">
                <item.icon size={22} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{item.label}</span>
                  {item.badge && (
                    <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
            <MdChevronRight className="text-gray-300 w-5 h-5" />
          </button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-transparent pb-8 pt-4">

      <div className="py-6">
        {/* Block 1: Things NOT in the mobile menu */}
        <MenuSection title="Account & Preferences" items={nonMobileItems} />
        
        {/* Block 2: The Rest (Mobile Menu Items) */}
        <MenuSection title="Main Navigation" items={mobileMenuItems} />

        {/* Block 3: Support & Legal */}
        <MenuSection title="Help & Support" items={supportItems} />

        {/* Logout Button */}
        <div className="px-4 mt-8">
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white rounded-2xl border border-red-100 hover:bg-red-50 active:bg-red-100 transition-colors shadow-sm text-red-600 font-medium"
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <MdLogout size={20} />
            <span>Log Out</span>
          </motion.button>
        </div>

      </div>
    </div>
  );
}