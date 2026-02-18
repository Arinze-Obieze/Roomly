'use client';

import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  MdHome, 
  MdChatBubbleOutline,
  MdPersonOutline,
  MdGroups
} from 'react-icons/md';
import { FaRegEdit } from 'react-icons/fa';
import { useChat } from '@/core/contexts/ChatContext';
import { BottomNavItem } from '../ui/BottomNavItem';

export const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useChat();

  const isActive = (path) => pathname === path;
  const isBuddyActive = pathname?.startsWith('/dashboard/buddy');

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
      {/* Glass container with brand border and rounded top */}
      <div className="backdrop-blur-xl bg-white/80 border-t border-[#BCCCDC] rounded-t-3xl px-3 py-2 shadow-soft safe-area-bottom">
        <div className="flex items-end justify-around">
          {/* Discover */}
          <BottomNavItem
            icon={MdHome}
            label="Discover"
            active={isActive('/dashboard')}
            onClick={() => router.push('/dashboard')}
          />

          {/* Buddy‑Up */}
          <BottomNavItem
            icon={MdGroups}
            label="Buddy‑Up"
            active={isBuddyActive}
            onClick={() => router.push('/dashboard/buddy')}
          />

          {/* Middle – Listings (primary action, elevated) */}
          <div className="relative -top-5">
            <motion.button
              onClick={() => router.push('/my-properties')}
              className="flex flex-col items-center"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white transition-all shadow-[0_10px_25px_-5px_rgba(255,107,107,0.4)] ${
                  isActive('/my-properties')
                    ? 'bg-[#020617] text-white'        // active navy
                    : 'bg-[#FF6B6B] text-white hover:bg-[#e05a5a]' // brand coral
                }`}
              >
                <FaRegEdit size={22} />
              </div>
              <span
                className={`text-[11px] mt-1 font-medium ${
                  isActive('/my-properties') ? 'text-[#020617]' : 'text-[#627D98]'
                }`}
              >
                Listings
              </span>
            </motion.button>
          </div>

          {/* Messages – with teal badge */}
          <BottomNavItem
            icon={MdChatBubbleOutline}
            label="Messages"
            active={isActive('/messages')}
            badge={unreadCount > 0 ? unreadCount : null}
            onClick={() => router.push('/messages')}
          />

          {/* Profile */}
          <BottomNavItem
            icon={MdPersonOutline}
            label="Profile"
            active={isActive('/profile')}
            onClick={() => router.push('/profile')}
          />
        </div>
      </div>
    </nav>
  );
};