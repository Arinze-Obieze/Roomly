'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { MdEmail, MdPhone, MdPerson, MdCalendarToday } from 'react-icons/md';

export default function ProfileView() {
  const { user } = useAuthContext();

  if (!user) return null;

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
      <div className="p-2 bg-white rounded-lg text-slate-900 shadow-sm border border-slate-100">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-slate-900 font-medium">{value || 'Not set'}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InfoItem 
          icon={MdEmail} 
          label="Email Address" 
          value={user.email} 
        />
        <InfoItem 
          icon={MdPerson} 
          label="Full Name" 
          value={user.full_name} 
        />
        <InfoItem 
          icon={MdPhone} 
          label="Phone Number" 
          value={user.phone_number} 
        />
        <InfoItem 
          icon={MdCalendarToday} 
          label="Date of Birth" 
          value={user.date_of_birth && new Date(user.date_of_birth).toLocaleDateString()} 
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">About Me</h3>
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
          {user.bio ? (
            <p className="whitespace-pre-wrap">{user.bio}</p>
          ) : (
            <p className="text-slate-400 italic">No bio added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
