
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import GroupChat from './GroupChat';
import InviteMemberModal from './InviteMemberModal';
import { MdPersonAdd, MdChat, MdHomeWork, MdSettings, MdPerson } from 'react-icons/md';
import dayjs from 'dayjs';

export default function BuddyDashboard({ group }) {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('chat');
  const [members, setMembers] = useState([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (group?.id) {
        fetchMembers();
    }
  }, [group?.id]);

  const fetchMembers = async () => {
    const { data } = await supabase
        .from('buddy_group_members')
        .select(`
            role,
            joined_at,
            user:user_id (
                id, full_name, profile_picture
            )
        `)
        .eq('group_id', group.id)
        .eq('status', 'active');
    
    if (data) setMembers(data);
  };

  if (!group) return <div>Loading group...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-900">{group.name}</h1>
                <span className="bg-red-50 text-red-500 text-xs font-bold px-3 py-1 rounded-full border border-red-100">
                    {members.length} Members
                </span>
            </div>
            <p className="text-slate-500 text-sm">Created {dayjs(group.created_at).format('MMM D, YYYY')}</p>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="flex -space-x-3 mr-4">
                {members.map(m => (
                    <div key={m.user.id} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden" title={m.user.full_name}>
                        {m.user.profile_picture ? (
                            <img src={m.user.profile_picture} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                {m.user.full_name[0]}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <button 
                onClick={() => setIsInviteOpen(true)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
            >
                <MdPersonAdd size={20} />
                Invite
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar / Tabs (Mobile adapted) */}
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm">
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                        activeTab === 'chat' ? 'bg-red-50 text-red-500' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <MdChat size={22} />
                    Group Chat
                </button>
                <button 
                    onClick={() => setActiveTab('properties')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                        activeTab === 'properties' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <MdHomeWork size={22} />
                    Saved Properties
                </button>
                <button 
                    onClick={() => setActiveTab('members')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                        activeTab === 'members' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <MdPerson size={22} />
                    Members
                </button>
                 <button 
                    onClick={() => alert('Settings coming soon')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-slate-400 hover:text-slate-600 hover:bg-slate-50`}
                >
                    <MdSettings size={22} />
                    Settings
                </button>
            </div>

            {/* Members List (Sidebar specific) */}
             <div className="hidden lg:block bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Members</h3>
                <div className="space-y-3">
                    {members.map(m => (
                        <div key={m.user.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                     {m.user.profile_picture ? (
                                        <img src={m.user.profile_picture} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                            {m.user.full_name[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900">{m.user.full_name}</div>
                                    <div className="text-xs text-slate-400 capitalize">{m.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
             {activeTab === 'chat' && <GroupChat groupId={group.id} />}
             
             {activeTab === 'properties' && (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center h-[500px] flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <MdHomeWork className="text-slate-300 text-4xl" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No properties yet</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">
                        Share properties from the dashboard to discuss them with your group.
                    </p>
                </div>
             )}

             {activeTab === 'members' && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-900 mb-6">Manage Members</h3>
                    <div className="space-y-4">
                        {members.map(m => (
                            <div key={m.user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                                         {m.user.profile_picture ? (
                                            <img src={m.user.profile_picture} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-sm">
                                                {m.user.full_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{m.user.full_name}</div>
                                        <div className="text-sm text-slate-500">Joined {dayjs(m.joined_at).format('MMM D')}</div>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    m.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {m.role}
                                </span>
                            </div>
                        ))}
                    </div>
                  </div>
             )}
        </div>
      </div>

      <InviteMemberModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        groupId={group.id}
      />
    </div>
  );
}
