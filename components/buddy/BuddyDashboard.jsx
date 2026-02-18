
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from '@/core/contexts/AuthContext';
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

  if (!group) return <div className="p-8 text-center text-navy-400 font-medium">Loading group...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950 rounded-[2.5rem] shadow-xl p-8 mb-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-terracotta-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-navy-700/30 rounded-full blur-2xl transform -translate-x-1/4 translate-y-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">{group.name}</h1>
                    <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-xs font-bold px-3 py-1 rounded-full">
                        {members.length} Members
                    </span>
                </div>
                <p className="text-navy-200 text-sm font-medium opacity-80">Created {dayjs(group.created_at).format('MMMM D, YYYY')}</p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                    {members.map(m => (
                        <div key={m.user.id} className="w-10 h-10 rounded-full border-2 border-navy-900 bg-navy-800 overflow-hidden" title={m.user.full_name}>
                            {m.user.profile_picture ? (
                                <img src={m.user.profile_picture} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs bg-gradient-to-br from-terracotta-500 to-terracotta-600">
                                    {m.user.full_name[0]}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => setIsInviteOpen(true)}
                    className="bg-white text-navy-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-navy-50 transition-all shadow-lg active:scale-95"
                >
                    <MdPersonAdd size={20} className="text-terracotta-600" />
                    Invite
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mobile Tabs */}
        <div className="lg:hidden col-span-1 bg-white rounded-2xl border border-navy-100 p-2 mb-4 overflow-x-auto flex gap-2 no-scrollbar shadow-sm">
             <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === 'chat' ? 'bg-navy-900 text-white shadow-md' : 'text-navy-600 hover:bg-navy-50'
                }`}
            >
                <MdChat size={18} />
                Chat
            </button>
            <button 
                onClick={() => setActiveTab('properties')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === 'properties' ? 'bg-navy-900 text-white shadow-md' : 'text-navy-600 hover:bg-navy-50'
                }`}
            >
                <MdHomeWork size={18} />
                Properties
            </button>
            <button 
                onClick={() => setActiveTab('members')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === 'members' ? 'bg-navy-900 text-white shadow-md' : 'text-navy-600 hover:bg-navy-50'
                }`}
            >
                <MdPerson size={18} />
                Members
            </button>
        </div>

        {/* Desktop Sidebar / Tabs */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] border border-navy-100 p-3 shadow-sm">
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-3xl font-bold transition-all ${
                        activeTab === 'chat' 
                            ? 'bg-navy-50 text-navy-900 border border-navy-100 shadow-sm' 
                            : 'text-navy-500 hover:bg-navy-50 hover:text-navy-700'
                    }`}
                >
                    <MdChat size={22} className={activeTab === 'chat' ? 'text-terracotta-500' : ''} />
                    Group Chat
                </button>
                <button 
                    onClick={() => setActiveTab('properties')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-3xl font-bold transition-all ${
                        activeTab === 'properties' 
                            ? 'bg-navy-50 text-navy-900 border border-navy-100 shadow-sm' 
                            : 'text-navy-500 hover:bg-navy-50 hover:text-navy-700'
                    }`}
                >
                    <MdHomeWork size={22} className={activeTab === 'properties' ? 'text-terracotta-500' : ''} />
                    Saved Properties
                </button>
                <button 
                    onClick={() => setActiveTab('members')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-3xl font-bold transition-all ${
                        activeTab === 'members' 
                            ? 'bg-navy-50 text-navy-900 border border-navy-100 shadow-sm' 
                            : 'text-navy-500 hover:bg-navy-50 hover:text-navy-700'
                    }`}
                >
                    <MdPerson size={22} className={activeTab === 'members' ? 'text-terracotta-500' : ''} />
                    Members
                </button>
                 <button 
                    onClick={() => alert('Settings coming soon')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-3xl font-bold transition-all text-navy-400 hover:text-navy-600 hover:bg-navy-50`}
                >
                    <MdSettings size={22} />
                    Settings
                </button>
            </div>

            {/* Members List (Sidebar Summary) */}
             <div className="bg-white rounded-[2rem] border border-navy-100 p-6 shadow-sm">
                <h3 className="font-heading font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500"></span>
                    Members
                </h3>
                <div className="space-y-4">
                    {members.map(m => (
                        <div key={m.user.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-navy-50 border border-navy-100 overflow-hidden">
                                     {m.user.profile_picture ? (
                                        <img src={m.user.profile_picture} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-navy-400 text-xs">
                                            {m.user.full_name[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-navy-900 group-hover:text-terracotta-600 transition-colors">{m.user.full_name}</div>
                                    <div className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">{m.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
             {activeTab === 'chat' && (
                <div className="bg-white rounded-[2rem] border border-navy-100 shadow-sm overflow-hidden">
                    <GroupChat groupId={group.id} />
                </div>
             )}
             
             {activeTab === 'properties' && (
                sharedProperties.length > 0 ? (
                    <div className="bg-white rounded-[2rem] border border-navy-100 p-6 min-h-[500px]">
                        <h3 className="font-heading font-bold text-navy-900 mb-6 text-xl">Shared Properties</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {sharedProperties.map((prop, i) => (
                                <a 
                                    key={`${prop.id}-${i}`} 
                                    href={`/rooms/${prop.id}`}
                                    className="block group border border-navy-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-navy-900/5 transition-all bg-white"
                                >
                                    <div className="aspect-[4/3] bg-navy-50 relative overflow-hidden">
                                        <img src={prop.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500"></span>
                                            {dayjs(prop.shared_at).fromNow()}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h4 className="font-bold text-navy-900 text-base line-clamp-1 group-hover:text-terracotta-600 transition-colors">{prop.title}</h4>
                                        <div className="text-navy-500 text-sm mt-1 mb-4 flex items-center gap-1.5">
                                             <MdHomeWork size={16} className="text-navy-300" /> 
                                             <span className="truncate">{prop.location}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-navy-50">
                                            <span className="font-heading font-extrabold text-navy-900">{prop.price}</span>
                                            <span className="text-xs font-bold text-navy-400 group-hover:text-terracotta-600 transition-colors">
                                                View Details
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-navy-100 p-12 text-center h-[500px] flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-navy-50 rounded-full flex items-center justify-center mb-6">
                            <MdHomeWork className="text-navy-200 text-5xl" />
                        </div>
                        <h3 className="text-2xl font-bold text-navy-900 mb-2">No properties yet</h3>
                        <p className="text-navy-500 max-w-xs mx-auto">
                            Share properties from the dashboard to discuss them with your group.
                        </p>
                    </div>
                )
             )}

             {activeTab === 'members' && (
                  <div className="bg-white rounded-[2rem] border border-navy-100 p-8">
                    <h3 className="font-heading font-bold text-navy-900 mb-8 text-xl">Manage Members</h3>
                    <div className="space-y-4">
                        {members.map(m => (
                            <div key={m.user.id} className="flex items-center justify-between p-5 bg-navy-50 rounded-3xl border border-navy-100/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden text-xl">
                                         {m.user.profile_picture ? (
                                            <img src={m.user.profile_picture} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-navy-300">
                                                {m.user.full_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-navy-900">{m.user.full_name}</div>
                                        <div className="text-sm text-navy-500 font-medium">Joined {dayjs(m.joined_at).format('MMMM D, YYYY')}</div>
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    m.role === 'admin' ? 'bg-terracotta-100 text-terracotta-700' : 'bg-navy-200 text-navy-600'
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
