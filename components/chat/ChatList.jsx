'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/core/contexts/ChatContext';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdInbox, MdSend, MdCheckCircle, MdArchive, MdUnarchive, MdMoreVert } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';

export const ChatList = ({ activeTab, onTabChange }) => {
  const { 
      conversations, 
      archivedConversations,
      activeConversation, 
      setActiveConversation, 
      loading,
      fetchNextConversations,
      hasNextConversations,
      isFetchingNextConversations,
      archiveConversation
  } = useChat();
  const { user } = useAuthContext();
  const [showArchived, setShowArchived] = useState(false);
  const [archivingId, setArchivingId] = useState(null);

  // Determine which list to show based on sidebar state
  const activeConversations = conversations.filter(c => {
    if (activeTab === 'received') return c.host_id === user?.id;
    return c.tenant_id === user?.id;
  });

  // Archived view shows ALL archived conversations (both sent & received)
  // regardless of the current received/sent tab — it's its own inbox
  const archivedList = archivedConversations;

  const displayedList = showArchived ? archivedList : activeConversations;

  const handleArchiveToggle = async (e, conv, archive) => {
    e.stopPropagation();
    setArchivingId(conv.id);
    try {
      await archiveConversation(conv.id, archive);
    } finally {
      setArchivingId(null);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-2 gap-2 border-b border-navy-100 shrink-0">
          <div className="flex-1 h-10 bg-navy-100 rounded-lg animate-pulse" />
          <div className="flex-1 h-10 bg-navy-100 rounded-lg animate-pulse" />
        </div>
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
      {/* Fixed Header Section */}
      <div className="shrink-0 border-b border-navy-100 bg-white sticky top-0 z-20">
        {/* Inbox / Sent Tabs */}
        <div className="flex items-center p-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { onTabChange('received'); setShowArchived(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-heading font-medium transition-all ${
              activeTab === 'received' && !showArchived
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
            onClick={() => { onTabChange('sent'); setShowArchived(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-heading font-medium transition-all ${
              activeTab === 'sent' && !showArchived
                ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/20' 
                : 'text-navy-500 hover:bg-navy-50'
            }`}
          >
            <MdSend size={18} />
            Sent
          </motion.button>

          {/* Archive toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowArchived(v => !v)}
            title={showArchived ? 'Back to inbox' : `Archived (${archivedConversations.length})`}
            className={`p-2.5 rounded-lg text-sm font-heading font-medium transition-all shrink-0 ${
              showArchived
                ? 'bg-navy-800 text-white shadow-md' 
                : 'text-navy-400 hover:bg-navy-50'
            }`}
          >
            <MdArchive size={18} />
          </motion.button>
        </div>

        {/* Archived banner */}
        <AnimatePresence>
          {showArchived && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-2 bg-navy-800 flex items-center gap-2">
                <MdArchive size={14} className="text-navy-300" />
                <span className="text-xs font-heading font-bold text-navy-300 uppercase tracking-wider">
                  Archived Chats ({archivedList.length})
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable List Section */}
      <div className="flex-1 overflow-y-auto bg-white">
        {displayedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-navy-500 px-6 text-center py-12">
            <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center mb-3 border border-navy-200">
              {showArchived ? (
                <MdArchive className="text-navy-400" size={24} />
              ) : activeTab === 'received' ? (
                <MdInbox className="text-terracotta-500" size={24} />
              ) : (
                <MdSend className="text-terracotta-500" size={24} />
              )}
            </div>
            <p className="font-heading font-bold text-navy-950 mb-1">
              {showArchived ? 'No archived chats' : 'No messages yet'}
            </p>
            <p className="text-sm font-sans text-navy-500">
              {showArchived
                ? 'Chats you archive will appear here.'
                : activeTab === 'received' 
                  ? "When users contact you about your listings, they'll appear here."
                  : "Messages you send to hosts will appear here."
              }
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
              {displayedList.map(conv => {
                const otherParty = conv.tenant_id === user?.id ? conv.host : conv.tenant;
                const isActive = activeConversation === conv.id;
                const hasUnread = conv.unread_count > 0;
                const isArchiving = archivingId === conv.id;

                return (
                  <motion.div
                    key={conv.id}
                    variants={item}
                    className="relative group"
                  >
                    <button
                      onClick={() => setActiveConversation(conv.id)}
                      className={`w-full p-4 flex gap-3 text-left transition-colors ${
                        isActive ? 'bg-terracotta-50' : hasUnread ? 'bg-navy-50/30 font-bold hover:bg-navy-50' : 'hover:bg-navy-50'
                      }`}
                    >
                      {/* Active Indicator */}
                      {isActive ? (
                        <motion.div
                          layoutId="activeChatDot"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-terracotta-500 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      ) : (
                        hasUnread && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                        )
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
                        
                        {hasUnread && !showArchived && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-teal-500 rounded-full border-2 border-white flex items-center justify-center px-1 shadow-sm"
                          >
                            <span className="text-[10px] text-white font-bold">{conv.unread_count}</span>
                          </motion.div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex justify-between items-start mb-0.5">
                          <h3 className={`font-heading text-sm truncate pr-2 ${
                            isActive ? 'text-terracotta-700 font-bold' : hasUnread ? 'text-navy-950 font-bold' : 'text-navy-900 font-medium'
                          }`}>
                            {otherParty?.full_name || 'Unknown User'}
                          </h3>
                          <span className={`text-xs font-sans shrink-0 ${hasUnread && !isActive ? 'text-teal-600 font-bold' : 'text-navy-400'}`}>
                            {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                          </span>
                        </div>
                        
                        <p className={`text-xs font-sans mb-1 truncate ${hasUnread && !isActive ? 'text-navy-700 font-bold' : 'text-navy-500 font-medium'}`}>
                          {conv.property?.title || 'Unknown Property'} • {conv.property?.city}
                        </p>

                        <p className={`text-sm font-sans truncate flex items-center gap-1 ${
                          isActive ? 'text-terracotta-600 font-medium' : hasUnread ? 'text-navy-900 font-bold' : 'text-navy-600'
                        }`}>
                          {conv.last_message || 'Started a conversation'}
                          {conv.last_message_sender_id === user?.id && (
                            <MdCheckCircle className="text-teal-500" size={12} />
                          )}
                        </p>
                      </div>
                    </button>

                    {/* Archive / Unarchive quick action — appears on hover */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {showArchived ? (
                        <button
                          onClick={(e) => handleArchiveToggle(e, conv, false)}
                          disabled={isArchiving}
                          title="Restore chat"
                          className="p-2 rounded-full bg-white border border-navy-200 shadow-sm text-navy-400 hover:text-teal-500 hover:border-teal-300 transition-colors disabled:opacity-50"
                        >
                          {isArchiving ? <div className="w-4 h-4 border-2 border-navy-300 border-t-transparent rounded-full animate-spin" /> : <MdUnarchive size={16} />}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleArchiveToggle(e, conv, true)}
                          disabled={isArchiving}
                          title="Archive chat"
                          className="p-2 rounded-full bg-white border border-navy-200 shadow-sm text-navy-400 hover:text-navy-700 hover:border-navy-400 transition-colors disabled:opacity-50"
                        >
                          {isArchiving ? <div className="w-4 h-4 border-2 border-navy-300 border-t-transparent rounded-full animate-spin" /> : <MdArchive size={16} />}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
            
            {/* Load More Button */}
            {hasNextConversations && !showArchived && (
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
