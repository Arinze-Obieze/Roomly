'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { MdEdit, MdCalendarToday } from 'react-icons/md';

export default function ProfileHeader({ isEditing, onToggleEdit, hideEditButton }) {
  const { user } = useAuthContext();

  if (!user) return null;

  // Format join date
  const joinDate = new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <img
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=random`}
            alt={user.full_name}
            className="w-24 h-24 rounded-full object-cover border-4 border-slate-50"
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {user.full_name || 'Welcome, User'}
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 text-sm mb-4 md:mb-0">
            <MdCalendarToday />
            <span>Joined {joinDate}</span>
          </div>
        </div>

        <div>
          {!hideEditButton && (
            <button
              onClick={onToggleEdit}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isEditing
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <MdEdit />
              {isEditing ? 'Cancel Editing' : 'Edit Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
