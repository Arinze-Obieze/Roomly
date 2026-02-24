'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/core/contexts/ChatContext';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdInbox, MdSend, MdCheckCircle } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';

export const ChatList = ({ activeTab, onTabChange }) => {
  const { 
      conversations, 
      activeConversation, 
      setActiveConversation, 
      loading,
      fetchNextConversations,
      hasNextConversations,
      isFetchingNextConversations
  } = useChat();
  const { user } = useAuthContext();

  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'received') return c.host_id === user?.id;
    return c.tenant_id === user?.id;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        {/* Fixed Header Skeleton */}
        <div className="flex items-center p-2 gap-2 border-b border-navy-100 shrink-0">
          <div className="flex-1 h-10 bg-navy-100 rounded-lg animate-pulse" />
          <div className="flex-1 h-10 bg-navy-100 rounded-lg animate-pulse" />
        </div>
        {/* List Skeleton */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-navy-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white w-full md:w-96">
      {/* Fixed Header Section - Never scrolls */}
      <div className="shrink-0 border-b border-navy-100 bg-white sticky top-0 z-20">
        {/* Tabs */}
        <div className="flex items-center p-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange('received')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-heading font-medium transition-all ${
              activeTab === 'received' 
                ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/20' 
                : 'text-navy-500 hover:bg-navy-50'
            }`}
          >
            <MdInbox size={18} />
            Received
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange('sent')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-heading font-medium transition-all ${
              activeTab === 'sent' 
                ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/20' 
                : 'text-navy-500 hover:bg-navy-50'
            }`}
          >
            <MdSend size={18} />
            Sent
          </motion.button>
        </div>
      </div>

      {/* Scrollable List Section */}
      <div className="flex-1 overflow-y-auto bg-white">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-navy-500 px-6 text-center py-12">
            <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center mb-3 border border-navy-200">
              {activeTab === 'received' ? 
                <MdInbox className="text-terracotta-500" size={24} /> : 
                <MdSend className="text-terracotta-500" size={24} />
              }
            </div>
            <p className="font-heading font-bold text-navy-950 mb-1">No messages yet</p>
            <p className="text-sm font-sans text-navy-500">
              {activeTab === 'received' 
                ? "When users contact you about your listings, they'll appear here."
                : "Messages you send to hosts will appear here."}
            </p>
          </div>
        ) : (
          <>
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="divide-y divide-navy-100"
            >
              {filteredConversations.map(conv => {
                const otherParty = conv.tenant_id === user?.id ? conv.host : conv.tenant;
                const isActive = activeConversation === conv.id;
                const hasUnread = conv.unread_count > 0;

                return (
                  <motion.button
                    key={conv.id}
                    variants={item}
                    onClick={() => setActiveConversation(conv.id)}
                    className={`w-full p-4 flex gap-3 text-left relative transition-colors ${
                      isActive ? 'bg-terracotta-50' : 'hover:bg-navy-50'
                    }`}
                  >
                    {/* Active Indicator Dot */}
                    {isActive && (
                      <motion.div
                        layoutId="activeChatDot"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-terracotta-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {otherParty?.profile_picture ? (
                        <img 
                          src={otherParty.profile_picture} 
                          alt={otherParty.full_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white ring-2 ring-navy-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center font-heading font-bold border-2 border-white ring-2 ring-navy-100">
                          {otherParty?.full_name?.[0] || '?'}
                        </div>
                      )}
                      
                      {/* Unread Badge */}
                      {hasUnread && activeTab === 'received' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full border-2 border-white flex items-center justify-center"
                        >
                          <span className="text-[10px] text-white font-bold">{conv.unread_count}</span>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className={`font-heading font-bold text-sm truncate pr-2 ${
                          isActive ? 'text-terracotta-700' : 'text-navy-950'
                        }`}>
                          {otherParty?.full_name || 'Unknown User'}
                        </h3>
                        <span className="text-xs font-sans text-navy-400 shrink-0">
                          {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                        </span>
                      </div>
                      
                      <p className="text-xs font-sans font-medium text-navy-500 mb-1 truncate">
                        {conv.property?.title || 'Unknown Property'} • {conv.property?.city}
                      </p>

                      <p className={`text-sm font-sans truncate flex items-center gap-1 ${
                        isActive ? 'text-terracotta-600' : 'text-navy-600'
                      }`}>
                        {conv.last_message || 'Started a conversation'}
                        {conv.last_message_sender_id === user?.id && (
                          <MdCheckCircle className="text-teal-500" size={12} />
                        )}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
            
            {/* Load More Button */}
            {hasNextConversations && (
              <div className="p-4 text-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fetchNextConversations()}
                  disabled={isFetchingNextConversations}
                  className="text-xs font-heading font-medium text-terracotta-500 hover:text-terracotta-600 disabled:opacity-50"
                >
                  {isFetchingNextConversations ? 'Loading...' : 'Load More Conversations'}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
