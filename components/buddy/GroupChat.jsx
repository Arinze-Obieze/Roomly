
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdSend, MdAttachFile } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function GroupChat({ groupId }) {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const supabase = createClient();

  // Load initial messages
  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`buddy_messages:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'buddy_messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
            // Direct subscription - add message to state instead of pollling
            const newMessage = payload.new;
            setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/buddy/messages?groupId=${groupId}`);
      const data = await res.json();
      if (data.data) setMessages(data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input;
    setInput(''); // Optimistic clear

    try {
      const csrfRes = await fetch('/api/csrf-token');
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/buddy/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
           groupId,
           content
        })
      });
      if (!res.ok) throw new Error('Failed to send');
      
      fetchMessages();
      
    } catch (error) {
      console.error('Error sending message:', error.message || error);
      setInput(content); // Restore on error
      toast.error('Failed to send message');
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center text-navy-400 font-medium text-sm">Loading chat...</div>;

  return (
    <div className="flex flex-col h-[calc(100dvh-220px)] md:h-[600px] bg-white relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-navy-100">
        {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            
            return (
                <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''} group`}>
                    <div className="shrink-0 w-8 h-8 rounded-full bg-navy-50 border border-navy-100 overflow-hidden mt-1 shadow-sm">
                        {msg.sender?.profile_picture ? (
                            <img src={msg.sender.profile_picture} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-navy-400">
                                {msg.sender?.full_name?.[0]}
                            </div>
                        )}
                    </div>
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                             {!isMe && <span className="text-[10px] font-bold text-navy-500">{msg.sender?.full_name?.split(' ')[0]}</span>}
                             <span className="text-[10px] text-navy-300">
                                {dayjs(msg.created_at).format('h:mm A')}
                            </span>
                        </div>
                        
                        {msg.attachment_type === 'property' && msg.attachment_data ? (
                             <div className={`bg-white rounded-3xl p-2 shadow-md border ${isMe ? 'border-terracotta-100 rounded-tr-none' : 'border-navy-100 rounded-tl-none'} mb-1 max-w-xs cursor-pointer hover:shadow-lg transition-all group-hover:border-terracotta-200`}>
                                <div className="aspect-video relative bg-navy-50 rounded-2xl overflow-hidden mb-2">
                                    <img 
                                        src={msg.attachment_data.image} 
                                        className="w-full h-full object-cover" 
                                        alt={msg.attachment_data.title}
                                    />
                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-navy-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        {msg.attachment_data.price}
                                    </div>
                                </div>
                                <div className="px-2 pb-2">
                                    <h4 className="font-bold text-navy-900 text-sm line-clamp-1 mb-0.5">{msg.attachment_data.title}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-navy-500 mb-3">
                                        <span className="truncate">{msg.attachment_data.location}</span>
                                    </div>
                                    <a 
                                        href={`/rooms/${msg.attachment_data.id}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="block text-center w-full py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-xl transition-colors"
                                    >
                                        View Property
                                    </a>
                                </div>
                             </div>
                        ) : (
                            <div className={`px-5 py-3 rounded-3xl text-sm font-medium shadow-sm transition-all ${
                                isMe 
                                    ? 'bg-linear-to-br from-terracotta-500 to-terracotta-600 text-white rounded-tr-none shadow-terracotta-500/20' 
                                    : 'bg-navy-50 text-navy-800 rounded-tl-none border border-navy-100/50'
                            }`}>
                                {msg.content}
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-navy-50 flex items-center gap-3">
        <button type="button" className="p-2.5 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-xl transition-colors">
            <MdAttachFile size={22} />
        </button>
        <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-navy-50 border border-transparent hover:border-navy-200 focus:border-terracotta-500/50 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:bg-white transition-all text-navy-900 placeholder:text-navy-400 font-medium"
        />
        <button 
            type="submit" 
            disabled={!input.trim()}
            className="p-3 bg-navy-900 text-white rounded-2xl hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-navy-900/10 active:scale-95"
        >
            <MdSend size={20} className={input.trim() ? "text-terracotta-50" : ""} />
        </button>
      </form>
    </div>
  );
}
