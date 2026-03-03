
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdSend, MdAttachFile, MdClose, MdDescription } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { v4 as uuidv4 } from 'uuid';
import bytes from 'bytes';
import { motion, AnimatePresence } from 'framer-motion';

dayjs.extend(relativeTime);

export default function GroupChat({ groupId }) {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentParams, setAttachmentParams] = useState(null); // { type, url, name, size, fileObj }
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
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
  }, [messages, attachmentParams]);

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

  const uploadFileProcess = async (file) => {
    try {
      const lastDot = file.name.lastIndexOf('.');
      const fileExt = lastDot !== -1 ? file.name.slice(lastDot + 1) : '';
      const fileName = fileExt ? `${uuidv4()}.${fileExt}` : uuidv4();
      const filePath = `${groupId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('buddy_attachments')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('buddy_attachments')
        .getPublicUrl(filePath);

      return { publicUrl, filePath };
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error('Failed to upload file');
      return null;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (e.g. max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
    }

    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    setAttachmentParams({
        type: isImage ? 'image' : 'file',
        url: previewUrl,
        name: file.name,
        size: bytes(file.size),
        fileObj: file
    });
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAttachment = () => {
      if (attachmentParams?.url && attachmentParams.type === 'image') {
          URL.revokeObjectURL(attachmentParams.url);
      }
      setAttachmentParams(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !attachmentParams) return;

    let finalAttachmentType = null;
    let finalAttachmentData = null;
    let uploadedFilePath = null;
    
    const content = input;
    const prevAttachmentParams = attachmentParams;
    
    if (attachmentParams?.fileObj) {
        setIsUploading(true);
        const uploadResult = await uploadFileProcess(attachmentParams.fileObj);
        setIsUploading(false);
        
        if (!uploadResult) return; // don't send if upload failed
        
        uploadedFilePath = uploadResult.filePath;
        finalAttachmentType = attachmentParams.type;
        finalAttachmentData = {
            url: uploadResult.publicUrl,
            name: attachmentParams.name,
            size: attachmentParams.size
        };
    }

    setInput(''); // Optimistic clear
    setAttachmentParams(null); // Clear UI but don't revoke URL yet

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
           content: content.trim() ? content : null,
           attachmentType: finalAttachmentType,
           attachmentData: finalAttachmentData
        })
      });
      if (!res.ok) throw new Error('Failed to send');
      
      // Successfully sent, now we can revoke the preview URL
      if (prevAttachmentParams?.url && prevAttachmentParams.type === 'image') {
          URL.revokeObjectURL(prevAttachmentParams.url);
      }
      
      fetchMessages();
      
    } catch (error) {
      console.error('Error sending message:', error.message || error);
      setInput(content); // Restore on error
      setAttachmentParams(prevAttachmentParams); // Restore attachment UI
      
      // Cleanup the orphaned file in storage if upload succeeded but DB failed
      if (uploadedFilePath) {
          await supabase.storage.from('buddy_attachments').remove([uploadedFilePath]);
      }
      
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
                        ) : msg.attachment_type === 'image' && msg.attachment_data ? (
                             <div className={`bg-white rounded-2xl p-1.5 shadow-md border ${isMe ? 'border-terracotta-100 rounded-tr-none' : 'border-navy-100 rounded-tl-none'} mb-1 max-w-xs`}>
                                <a href={msg.attachment_data.url} target="_blank" rel="noreferrer">
                                    <img 
                                        src={msg.attachment_data.url} 
                                        alt={msg.attachment_data.name} 
                                        className="w-full h-auto rounded-xl max-h-60 object-cover cursor-ZoomIn hover:opacity-95 transition-opacity"
                                    />
                                </a>
                                {msg.content && (
                                     <div className="px-3 py-2 text-sm font-medium text-navy-800">
                                        {msg.content}
                                     </div>
                                )}
                             </div>
                        ) : msg.attachment_type === 'file' && msg.attachment_data ? (
                             <div className={`bg-white rounded-2xl p-3 shadow-md border ${isMe ? 'border-terracotta-100 rounded-tr-none' : 'border-navy-100 rounded-tl-none'} mb-1 max-w-xs flex flex-col gap-2`}>
                                <a 
                                    href={msg.attachment_data.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 bg-navy-50 hover:bg-navy-100 rounded-xl transition-colors group/file cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-terracotta-500 group-hover/file:scale-105 transition-transform">
                                        <MdDescription size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-navy-900 text-sm truncate">{msg.attachment_data.name}</h4>
                                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider mt-0.5">{msg.attachment_data.size}</p>
                                    </div>
                                </a>
                                {msg.content && (
                                     <div className="px-1 py-1 text-sm font-medium text-navy-800">
                                        {msg.content}
                                     </div>
                                )}
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
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-navy-50 flex items-center gap-3 relative">
        {/* Attachment Preview Overlay */}
        <AnimatePresence>
          {attachmentParams && (
              <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-xl border border-navy-100 p-2 z-10 flex items-center gap-3 pr-4 max-w-sm"
              >
                  {attachmentParams.type === 'image' && attachmentParams.url ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-navy-50 shrink-0 border border-navy-100">
                          <img src={attachmentParams.url} className="w-full h-full object-cover" />
                      </div>
                  ) : (
                      <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center text-terracotta-500 shrink-0 border border-navy-100">
                          <MdDescription size={24} />
                      </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-navy-900 truncate">{attachmentParams.name}</p>
                      <p className="text-xs text-navy-400 font-medium">{attachmentParams.size}</p>
                  </div>

                  <button 
                      type="button" 
                      onClick={clearAttachment}
                      className="p-1.5 hover:bg-red-50 text-navy-400 hover:text-red-500 rounded-full transition-colors"
                  >
                      <MdClose size={18} />
                  </button>
              </motion.div>
          )}
        </AnimatePresence>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-xl transition-colors shrink-0"
        >
            <MdAttachFile size={22} />
        </button>
        <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-w-0 bg-navy-50 border border-transparent hover:border-navy-200 focus:border-terracotta-500/50 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:bg-white transition-all text-navy-900 placeholder:text-navy-400 font-medium"
        />
        <button 
            type="submit" 
            disabled={(input.trim() === '' && !attachmentParams) || isUploading}
            className="p-3 bg-navy-900 text-white rounded-2xl hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-navy-900/10 active:scale-95 shrink-0"
        >
            {isUploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <MdSend size={20} className={input.trim() || attachmentParams ? "text-terracotta-50" : ""} />
            )}
        </button>
      </form>
    </div>
  );
}

