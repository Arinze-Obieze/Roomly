'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { MdSend, MdMoreVert, MdImage, MdArrowBack } from 'react-icons/md';
import { format } from 'date-fns';

export const ChatWindow = () => {
    const { 
        activeConversation, 
        setActiveConversation,
        messages, 
        sendMessage, 
        conversations,
        fetchMessages 
    } = useChat();
    const { user } = useAuthContext();
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Find full conversation object to get details
    const conversation = conversations.find(c => c.id === activeConversation);
    const otherParty = conversation ? (conversation.tenant_id === user?.id ? conversation.host : conversation.tenant) : null;
    const isMe = (msg) => msg.sender_id === user.id;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation);
        }
    }, [activeConversation, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const success = await sendMessage(activeConversation, newMessage);
        if (success) {
            setNewMessage('');
        }
        setSending(false);
    };

    if (!activeConversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">
                <p>Select a conversation to start messaging</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setActiveConversation(null)}
                        className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <MdArrowBack size={24} />
                    </button>
                    
                    {otherParty?.profile_picture ? (
                        <img 
                            src={otherParty.profile_picture} 
                            alt={otherParty.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-100 to-indigo-100 text-cyan-700 flex items-center justify-center font-bold border border-slate-200">
                            {otherParty?.full_name?.[0] || '?'}
                        </div>
                    )}
                    <div>
                        <h2 className="font-semibold text-slate-900">{otherParty?.full_name || 'Unknown User'}</h2>
                        <p className="text-xs text-slate-500">{conversation?.property?.title || 'Property Chat'}</p>
                    </div>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                    <MdMoreVert size={24} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.map((msg, i) => {
                    const isMyMsg = isMe(msg);
                    const showTime = i === 0 || new Date(msg.created_at) - new Date(messages[i-1].created_at) > 5 * 60 * 1000;

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'}`}>
                            {showTime && (
                                <span className="text-xs text-slate-400 my-2 self-center">
                                    {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                                </span>
                            )}
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                                isMyMsg 
                                    ? 'bg-cyan-600 text-white rounded-tr-none' 
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                            }`}>
                                {msg.content}
                            </div>
                            {isMyMsg && (
                                <span className="text-[10px] text-slate-400 mt-1 mr-1">
                                    {msg.is_read ? 'Read' : 'Delivered'}
                                </span>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    {/* <button type="button" className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-slate-50 rounded-full transition-colors">
                        <MdImage size={24} />
                    </button> */}
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 max-h-32 resize-none"
                            rows={1}
                            style={{ minHeight: '44px' }}
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim() || sending}
                            className="absolute right-2 bottom-2 p-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:hover:bg-cyan-600 transition-colors shadow-sm"
                        >
                            <MdSend size={18} />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
