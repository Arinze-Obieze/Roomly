
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
  const [sharedProperties, setSharedProperties] = useState([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (group?.id) {
        fetchMembers();
    }
  }, [group?.id]);

  useEffect(() => {
    if (activeTab === 'properties' && group?.id) {
        fetchSharedProperties();
    }
  }, [activeTab, group?.id]);

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

  const fetchSharedProperties = async () => {
       const { data } = await supabase
            .from('buddy_messages')
            .select('*')
            .eq('group_id', group.id)
            .eq('attachment_type', 'property')
            .order('created_at', { ascending: false });
        
       if (data) {
           // Dedup properties by ID if shared multiple times? 
           // For now, let's show all shares (chronological). 
           // actually, unique might be better.
           const unique = [];
           const seen = new Set();
           data.forEach(msg => {
               if (msg.attachment_data && !seen.has(msg.attachment_data.id)) {
                   seen.add(msg.attachment_data.id);
                   unique.push({ ...msg.attachment_data, shared_at: msg.created_at });
               }
           });
           setSharedProperties(unique);
       }
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
        {/* Mobile Tabs (Horizontal Scroll) */}
        <div className="lg:hidden col-span-1 bg-white rounded-2xl border border-slate-100 p-2 mb-4 overflow-x-auto flex gap-2 no-scrollbar">
             <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === 'chat' ? 'bg-red-50 text-red-500 border border-red-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
            >
                <MdChat size={18} />
                Chat
            </button>
            <button 
                onClick={() => setActiveTab('properties')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === 'properties' ? 'bg-cyan-50 text-cyan-600 border border-cyan-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
            >
                <MdHomeWork size={18} />
                Properties
            </button>
            <button 
                onClick={() => setActiveTab('members')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === 'members' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
            >
                <MdPerson size={18} />
                Members
            </button>
             <button 
                onClick={() => alert('Settings coming soon')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap text-slate-400 hover:text-slate-600`}
            >
                <MdSettings size={18} />
                Settings
            </button>
        </div>

        {/* Desktop Sidebar / Tabs */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
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
             <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
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
                sharedProperties.length > 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 min-h-[500px]">
                        <h3 className="font-bold text-slate-900 mb-6">Shared Properties ({sharedProperties.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sharedProperties.map((prop, i) => (
                                <a 
                                    key={`${prop.id}-${i}`} 
                                    href={`/rooms/${prop.id}`}
                                    className="block group border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                                >
                                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                        <img src={prop.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                                            Shared {dayjs(prop.shared_at).fromNow()}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-900 line-clamp-1">{prop.title}</h4>
                                        </div>
                                        <div className="text-slate-500 text-sm mb-3 flex items-center gap-1">
                                             <MdHomeWork size={14} /> {prop.location}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="font-extrabold text-slate-900">{prop.price}</span>
                                            <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                                                View
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center h-[500px] flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <MdHomeWork className="text-slate-300 text-4xl" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No properties yet</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            Share properties from the dashboard to discuss them with your group.
                        </p>
                    </div>
                )
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
