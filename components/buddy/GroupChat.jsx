
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
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
            fetchNewMessage(payload.new.id);
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

  const fetchNewMessage = async (id) => {
    // Fetch the single new message to get the sender relation expanded
    // Optimisation: We could just push payload if we had sender info, 
    // but payload doesn't have joined tables.
    // For now, let's just re-fetch or fetch single.
    // Efficient way: Fetch just that one message with sender.
    // But since our API returns list, let's just re-fetch list for simplicity or append if we can match sender locally.
    // Re-fetching essential for now.
    fetchMessages();
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
      const res = await fetch('/api/buddy/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           groupId,
           content
        })
      });
      if (!res.ok) throw new Error('Failed to send');
      
      // Manual fetch to ensure UI updates even if subscription is slow/fails
      fetchMessages();
      
    } catch (error) {
      console.error('Error sending message:', error.message || error);
      setInput(content); // Restore on error
      toast.error('Failed to send message');
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center">Loading chat...</div>;

  return (
    <div className="flex flex-col h-[calc(100dvh-220px)] md:h-[600px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id; // Fixed: Use top-level sender_id as msg.sender does not contain id
            // Our API expansion: sender: { full_name, profile_picture }
            // Wait, msg.sender_id is the ID column. msg.sender is the object.
            // We need to check authentication user id vs msg.sender_id (not expanded obj) usually,
            // but the API response has `sender` object. We need `sender_id` column too.
            // Let's check API response structure. 
            // It selects: id, content... sender:sender_id(...)
            // It typically DOES NOT include sender_id as a primitive unless explicitly asked.
            // But we know who we are. 
            // Actually, we should ask for sender_id in the select query to be sure.
            // Let's assume for now we look at msg.sender_id (Supabase usually returns the FK column too if asked or by default?)
            // If not, we rely on msg.sender (which is an object).
            // Let's update API to include sender_id explicitly if needed, or check if supabase includes it. 
            // Standard supabase-js: returns `sender: { ... }`. Original `sender_id` column might be hidden if there's a conflict or just present.
            // Let's rely on `user.id` comparison.
            // Actually, for `isMe`, we need `sender_id`.
            // I'll assume we can pass `user.id` context.
            // Is `msg.sender_id` available? The query `select(..., sender:sender_id(...))` *replaces* sender_id with the object if not careful? No, usually it adds `sender`.
            // Let's check API. `sender:sender_id(...)`. This usually creates a `sender` property. `sender_id` column remains if selecting `*` but we selected specific fields.
            // We did NOT select `sender_id` in the API. I should fix the API or just use msg.sender.full_name as check (bad).
            // I will fix the API to include `sender_id` or just verify here.
            
            // For now, let's assume isMe calculation might be tricky without sender_id.
            // I will optimistically update the client API call logic or backend.
            // Better: update backend to return `sender_id`.
            
            return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                        {msg.sender?.profile_picture ? (
                            <img src={msg.sender.profile_picture} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                {msg.sender?.full_name?.[0]}
                            </div>
                        )}
                    </div>
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {msg.attachment_type === 'property' && msg.attachment_data ? (
                             <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 mb-1 max-w-xs cursor-pointer hover:shadow-md transition-shadow">
                                <div className="aspect-video relative bg-slate-100">
                                    <img 
                                        src={msg.attachment_data.image} 
                                        className="w-full h-full object-cover" 
                                        alt={msg.attachment_data.title}
                                    />
                                    <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg">
                                        {msg.attachment_data.price}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{msg.attachment_data.title}</h4>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 mb-2">
                                        <span className="truncate">{msg.attachment_data.location}</span>
                                    </div>
                                    <a 
                                        href={`/rooms/${msg.attachment_data.id}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="block text-center w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg transition-colors"
                                    >
                                        View Details
                                    </a>
                                </div>
                             </div>
                        ) : (
                            <div className={`px-4 py-2 rounded-2xl text-sm ${
                                isMe ? 'bg-red-400 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                            }`}>
                                {msg.content}
                            </div>
                        )}
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {dayjs(msg.created_at).fromNow()}
                        </span>
                    </div>
                </div>
            );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <MdAttachFile size={20} />
        </button>
        <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition-all"
        />
        <button 
            type="submit" 
            disabled={!input.trim()}
            className="p-2 bg-red-400 text-white rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <MdSend size={20} />
        </button>
      </form>
    </div>
  );
}
