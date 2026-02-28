'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/core/contexts/ChatContext';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdSend, MdMoreVert, MdArrowBack, MdCheckCircle, MdDoneAll } from 'react-icons/md';
import { format } from 'date-fns';
import GlobalSpinner from '@/components/ui/GlobalSpinner';

export const ChatWindow = () => {
    const { 
        activeConversation, 
        setActiveConversation,
        messages, 
        sendMessage, 
        conversations,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useChat();
    const { user } = useAuthContext();
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [prevScrollHeight, setPrevScrollHeight] = useState(null);

    const conversation = conversations.find(c => c.id === activeConversation);
    const otherParty = conversation ? (conversation.tenant_id === user?.id ? conversation.host : conversation.tenant) : null;
    const isMe = (msg) => msg.sender_id === user.id;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages.length]);

    useEffect(() => {
        if (prevScrollHeight && scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeight;
            if (diff > 0) {
                scrollContainerRef.current.scrollTop += diff;
            }
            setPrevScrollHeight(null);
        }
    }, [messages]);

    const handleLoadMore = async () => {
        if (scrollContainerRef.current) {
            setPrevScrollHeight(scrollContainerRef.current.scrollHeight);
        }
        await fetchNextPage();
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const content = newMessage;
        setNewMessage('');
        setSending(true);
        try {
            await sendMessage(activeConversation, content);
        } catch {
            setNewMessage(content);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-navy-50">
            {/* Fixed Header */}
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="h-16 bg-white border-b border-navy-200 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm sticky top-0 z-20"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveConversation(null)}
                        className="md:hidden p-2 -ml-2 text-navy-500 hover:bg-navy-50 rounded-full transition-colors shrink-0"
                    >
                        <MdArrowBack size={24} />
                    </motion.button>
                    
                    <div className="flex items-center gap-3 min-w-0">
                        {otherParty?.profile_picture ? (
                            <img 
                                src={otherParty.profile_picture} 
                                alt={otherParty.full_name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white ring-2 ring-terracotta-500/20 shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center font-heading font-bold border-2 border-white ring-2 ring-terracotta-500/20 shrink-0">
                                {otherParty?.full_name?.[0] || '?'}
                            </div>
                        )}
                        
                        <div className="min-w-0">
                            <h2 className="font-heading font-bold text-navy-950 truncate">{otherParty?.full_name || 'Unknown User'}</h2>
                            <p className="text-xs font-sans text-navy-500 truncate">{conversation?.property?.title || 'Property Chat'}</p>
                        </div>
                    </div>
                </div>
                
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-navy-50 rounded-full text-navy-500 transition-colors shrink-0"
                >
                    <MdMoreVert size={24} />
                </motion.button>
            </motion.div>

            {/* Scrollable Messages Area */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 md:px-6 py-4"
            >
                <div className="max-w-3xl mx-auto space-y-4">
                    {hasNextPage && (
                        <div className="flex justify-center">
                            <motion.button 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLoadMore}
                                disabled={isFetchingNextPage}
                                className="text-xs font-heading font-medium text-navy-500 hover:text-terracotta-500 bg-white px-3 py-1 rounded-full border border-navy-200 shadow-sm"
                            >
                                {isFetchingNextPage ? 'Loading...' : 'Load Previous Messages'}
                            </motion.button>
                        </div>
                    )}
                    
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => {
                            const isMyMsg = isMe(msg);
                            const showTime = i === 0 || new Date(msg.created_at) - new Date(messages[i-1].created_at) > 5 * 60 * 1000;

                            return (
                                <motion.div 
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'}`}
                                >
                                    {showTime && (
                                        <span className="text-xs font-sans text-navy-400 my-2 self-center bg-white px-2 py-1 rounded-full border border-navy-100">
                                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                                        </span>
                                    )}
                                    
                                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm font-sans break-words ${
                                        isMyMsg 
                                            ? 'bg-terracotta-500 text-white rounded-tr-none shadow-lg shadow-terracotta-500/20' 
                                            : 'bg-white border border-navy-200 text-navy-800 rounded-tl-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    
                                    {isMyMsg && (
                                        <span className="text-[10px] font-sans text-navy-400 mt-1 mr-1 flex items-center gap-1">
                                            {msg.is_read ? (
                                                <>
                                                    <MdDoneAll className="text-teal-500" size={12} />
                                                    Read
                                                </>
                                            ) : (
                                                <>
                                                    <MdCheckCircle className="text-navy-400" size={12} />
                                                    Delivered
                                                </>
                                            )}
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Fixed Input Area */}
            <motion.form 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onSubmit={handleSend} 
                className="p-4 bg-white border-t border-navy-200 shrink-0 sticky bottom-0 z-20"
            >
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder="Type a message..."
                                className="w-full bg-navy-50 border border-navy-200 rounded-2xl px-4 py-3 pr-12 text-sm font-sans focus:outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 max-h-32 resize-none placeholder-navy-400"
                                rows={1}
                                style={{ minHeight: '44px' }}
                            />
                            
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit" 
                                disabled={!newMessage.trim() || sending}
                                className="absolute right-2 bottom-2 p-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 disabled:opacity-50 disabled:hover:bg-terracotta-500 transition-all shadow-lg shadow-terracotta-500/20"
                            >
                                {sending ? (
                                    <GlobalSpinner size="sm" color="white" />
                                ) : (
                                    <MdSend size={18} />
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.form>
        </div>
    );
};
