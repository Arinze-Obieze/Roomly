'use client';

import { useState, useEffect, useRef } from 'react';
import { MdSend, MdPerson, MdCheckCircle, MdOutlineFlag, MdUpdate, MdAttachFile, MdClose, MdDescription } from 'react-icons/md';
import { fetchWithCsrf } from '@/core/utils/fetchWithCsrf';
import { createClient } from '@/core/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import bytes from 'bytes';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { motion, AnimatePresence } from 'framer-motion';

dayjs.extend(relativeTime);

export default function AdminTicketConversation({ ticket, onUpdate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentParams, setAttachmentParams] = useState(null); // { type, url, name, size, fileObj }
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
  }, [ticket.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/support/tickets/${ticket.id}/messages`);
      const data = await res.json();
      if (data.data) setMessages(data.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      setUpdating(true);
      const res = await fetchWithCsrf('/api/superadmin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, status })
      });

      if (res.ok) {
        toast.success(`Ticket status updated to ${status}`);
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePriority = async (priority) => {
    try {
      setUpdating(true);
      const res = await fetchWithCsrf('/api/superadmin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, priority })
      });

      if (res.ok) {
        toast.success(`Priority set to ${priority}`);
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Failed to update priority');
    } finally {
      setUpdating(false);
    }
  };

  const uploadFileProcess = async (file) => {
    try {
      const lastDot = file.name.lastIndexOf('.');
      const fileExt = lastDot !== -1 ? file.name.slice(lastDot + 1) : '';
      const fileName = fileExt ? `${uuidv4()}.${fileExt}` : uuidv4();
      const filePath = `${ticket.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('support_attachments')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('support_attachments')
        .getPublicUrl(filePath);

      return { publicUrl, filePath };
    } catch (error) {
      console.error('Upload Error:', error);
      return null;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
    if ((!input.trim() && !attachmentParams) || sending || isUploading) return;

    const content = input;
    const prevAttachmentParams = attachmentParams;
    const isFile = !!attachmentParams?.fileObj;

    try {
      setSending(true);
      setInput('');
      setAttachmentParams(null);

      let finalAttachmentType = null;
      let finalAttachmentData = null;
      let uploadedFilePath = null;

      if (isFile) {
        setIsUploading(true);
        const uploadResult = await uploadFileProcess(prevAttachmentParams.fileObj);
        setIsUploading(false);
        
        if (!uploadResult) {
          setInput(content);
          setAttachmentParams(prevAttachmentParams);
          setSending(false);
          return;
        }

        uploadedFilePath = uploadResult.filePath;
        finalAttachmentType = prevAttachmentParams.type;
        finalAttachmentData = {
          url: uploadResult.publicUrl,
          name: prevAttachmentParams.name,
          size: prevAttachmentParams.size
        };
      }

      const res = await fetchWithCsrf(`/api/support/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content.trim() || null,
          attachmentType: finalAttachmentType,
          attachmentData: finalAttachmentData
        })
      });

      if (res.ok) {
        fetchMessages();
        onUpdate?.();
        if (prevAttachmentParams?.url && prevAttachmentParams.type === 'image') {
          URL.revokeObjectURL(prevAttachmentParams.url);
        }
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setInput(content);
      setAttachmentParams(prevAttachmentParams);
    } finally {
      setSending(false);
      setIsUploading(false);
    }
  };

  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center h-full">
      <GlobalSpinner size="md" color="primary" />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-full overflow-hidden shadow-sm">
      {/* Admin Header with Controls */}
      <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 mb-1">{ticket.subject}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-500 font-medium">User: {ticket.user?.full_name} ({ticket.user?.email})</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-slate-500 font-bold uppercase">{ticket.category}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <button
                    key={s}
                    disabled={updating}
                    onClick={() => handleUpdateStatus(s)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        ticket.status === s ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {s.split('_')[0]}
                  </button>
              ))}
           </div>
           
           <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              {['low', 'medium', 'high', 'urgent'].map(p => (
                  <button
                    key={p}
                    disabled={updating}
                    onClick={() => handleUpdatePriority(p)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        ticket.priority === p ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
              ))}
           </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20">
        {messages.map((msg) => {
          const isAdmin = msg.sender_role === 'admin';
          return (
            <div key={msg.id} className={`flex gap-4 ${isAdmin ? 'flex-row-reverse' : ''}`}>
              <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 overflow-hidden shadow-sm">
                {msg.sender?.profile_picture ? (
                  <img src={msg.sender.profile_picture} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <MdPerson size={18} />
                  </div>
                )}
              </div>
              <div className={`max-w-[80%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                  isAdmin 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.attachment_type === 'image' && msg.attachment_data && (
                    <div className="mb-2">
                      <a href={msg.attachment_data.url} target="_blank" rel="noreferrer">
                        <img src={msg.attachment_data.url} alt="" className="max-w-full rounded-lg max-h-64 object-contain" />
                      </a>
                    </div>
                  )}
                  {msg.attachment_type === 'file' && msg.attachment_data && (
                    <a 
                      href={msg.attachment_data.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${
                        isAdmin ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900'
                      }`}
                    >
                      <MdDescription size={24} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate text-xs">{msg.attachment_data.name}</div>
                        <div className="text-[10px] opacity-70">{msg.attachment_data.size}</div>
                      </div>
                    </a>
                  )}
                  {msg.content}
                </div>
                <div className="flex items-center gap-2 mt-2 px-1">
                   {isAdmin && (
                       <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                           <MdUpdate size={12} /> Response Sent
                       </span>
                   )}
                   <span className="text-[10px] text-slate-400 font-medium">
                     {isAdmin ? 'You' : ticket.user?.full_name} • {dayjs(msg.created_at).format('h:mm A')}
                   </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <AnimatePresence>
          {attachmentParams && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-10 flex items-center gap-3 pr-4 max-w-xs"
            >
              {attachmentParams.type === 'image' && attachmentParams.url ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                  <img src={attachmentParams.url} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-primary shrink-0 border border-slate-200">
                  <MdDescription size={20} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{attachmentParams.name}</p>
              </div>
              <button type="button" onClick={clearAttachment} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <MdClose size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors shrink-0"
          >
            <MdAttachFile size={22} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type an administrative response..."
            className="flex-1 bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={(!input.trim() && !attachmentParams) || sending || isUploading}
            className="min-w-[48px] p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 shadow-md flex items-center justify-center"
          >
            {sending || isUploading ? <GlobalSpinner size="sm" color="white" /> : <MdSend size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
