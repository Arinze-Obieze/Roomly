'use client';

import { useChat } from '@/contexts/ChatContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { MdInbox, MdSend, MdImage } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';

export const ChatList = ({ activeTab, onTabChange }) => {
  const { conversations, activeConversation, setActiveConversation, loading } = useChat();
  const { user } = useAuthContext();

  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'received') return c.host_id === user?.id; // Messages sent to me (as host)
    return c.tenant_id === user?.id; // Messages I sent (as tenant)
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full md:w-96">
      {/* Tabs */}
      <div className="flex items-center p-2 gap-2 border-b border-slate-100">
        <button
          onClick={() => onTabChange('received')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'received' 
              ? 'bg-slate-900 text-white' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MdInbox size={18} />
          Received
        </button>
        <button
          onClick={() => onTabChange('sent')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'sent' 
              ? 'bg-slate-900 text-white' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MdSend size={18} />
          Sent
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 px-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              {activeTab === 'received' ? <MdInbox size={24} /> : <MdSend size={24} />}
            </div>
            <p className="font-medium mb-1">No messages yet</p>
            <p className="text-sm">
              {activeTab === 'received' 
                ? "When users contact you about your listings, they'll appear here."
                : "Messages you send to hosts will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredConversations.map(conv => {
              // Determine other party details activeTab
              // If I am host (Received tab), show Tenant. If I am tenant (Sent tab), show Host.
              const otherParty = activeTab === 'received' ? conv.tenant : conv.host;
              const isActive = activeConversation === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`w-full p-4 flex gap-3 hover:bg-slate-50 transition-colors text-left ${
                    isActive ? 'bg-cyan-50/50 hover:bg-cyan-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                     {otherParty?.profile_picture ? (
                        <img 
                          src={otherParty.profile_picture} 
                          alt={otherParty.full_name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200"
                        />
                     ) : (
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-cyan-100 to-indigo-100 text-cyan-700 flex items-center justify-center font-bold border border-slate-200">
                          {otherParty?.full_name?.[0] || '?'}
                        </div>
                     )}
                     {/* Property Thumbnail Badge */}
                     {conv.property?.property_media?.[0]?.url && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                             {/* Note: We will fix image URL resolution later if needed, assume relative for now */}
                             <img 
                                src={`https://aiovmhiokeisdizhcxvm.supabase.co/storage/v1/object/public/property-media/${conv.property.property_media[0].url}`}
                                alt="Property"
                                className="w-full h-full object-cover"
                             />
                        </div>
                     )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className={`font-semibold text-sm truncate pr-2 ${isActive ? 'text-cyan-900' : 'text-slate-900'}`}>
                        {otherParty?.full_name || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-slate-400 shrink-0">
                        {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                      </span>
                    </div>
                    
                    <p className="text-xs font-medium text-slate-500 mb-1 truncate">
                      {conv.property?.title || 'Unknown Property'} • {conv.property?.city}
                    </p>

                    <p className={`text-sm truncate ${isActive ? 'text-cyan-700' : 'text-slate-600'}`}>
                      {conv.last_message || 'Started a conversation'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
