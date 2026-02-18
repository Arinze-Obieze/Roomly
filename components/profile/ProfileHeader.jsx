'use client';

import { motion } from 'framer-motion';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdEdit, MdCalendarToday } from 'react-icons/md';

import Image from 'next/image';

export default function ProfileHeader({ isEditing, onToggleEdit, hideEditButton }) {
  const { user } = useAuthContext();

  if (!user) return null;

  const joinDate = new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const avatarUrl = user.profile_picture || user.avatar_url;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl border border-navy-200 p-6 mb-6 shadow-xl shadow-navy-950/5"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          {avatarUrl ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-navy-50 ring-2 ring-terracotta-500/20">
              <img
                src={avatarUrl}
                alt={user.full_name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-terracotta-50 text-terracotta-600 border-4 border-navy-50 ring-2 ring-terracotta-500/20 flex items-center justify-center text-3xl font-heading font-bold">
              {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 rounded-full border-2 border-white" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-heading font-bold text-navy-950 mb-1">
            {user.full_name || 'Welcome, User'}
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-2 text-navy-500 text-sm font-sans mb-4 md:mb-0">
            <MdCalendarToday className="text-terracotta-400" />
            <span>Joined {joinDate}</span>
          </div>
        </div>

        <div>
          {!hideEditButton && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleEdit}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-heading font-medium transition-all shadow-lg ${
                isEditing
                  ? 'bg-navy-100 text-navy-700 hover:bg-navy-200 shadow-navy-950/5'
                  : 'bg-terracotta-500 text-white hover:bg-terracotta-600 shadow-terracotta-500/20'
              }`}
            >
              <MdEdit size={18} />
              {isEditing ? 'Cancel Editing' : 'Edit Profile'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}