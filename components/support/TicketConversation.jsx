'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdSend, MdPerson, MdAttachFile, MdClose, MdDescription } from 'react-icons/md';
import { fetchWithCsrf } from '@/core/utils/fetchWithCsrf';
import { useConfirmation } from '@/core/contexts/ConfirmationContext';
import { createClient } from '@/core/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import bytes from 'bytes';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { motion, AnimatePresence } from 'framer-motion';

dayjs.extend(relativeTime);

export default function TicketConversation({ ticket, onUpdate }) {
  const { user } = useAuthContext();
  const { alert: showModalAlert } = useConfirmation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentParams, setAttachmentParams] = useState(null); // { type, url, name, size, fileObj }
  const [signedUrlByPath, setSignedUrlByPath] = useState({});
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
      return { filePath };
    } catch (error) {
      console.error('Upload Error:', error);
      return null;
    }
  };

  const getSignedUrl = async (path) => {
    if (!path) return null;
    if (signedUrlByPath[path]) return signedUrlByPath[path];
    try {
      const res = await fetch(`/api/support/attachment-url?ticketId=${ticket.id}&path=${encodeURIComponent(path)}`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.url) return null;
      setSignedUrlByPath(prev => ({ ...prev, [path]: payload.url }));
      return payload.url;
    } catch {
      return null;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showModalAlert({
        title: 'File Too Large',
        message: 'File size must be less than 5MB',
        type: 'info'
      });
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
          path: uploadResult.filePath,
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
      setInput(content);
      setAttachmentParams(prevAttachmentParams);
    } finally {
      setSending(false);
      setIsUploading(false);
    }
  };

  if (loading) return (
    <div className="bg-white rounded-4xl border border-navy-100 p-12 flex items-center justify-center min-h-[400px]">
      <GlobalSpinner size="md" color="primary" />
    </div>
  );

  return (
    <div className="bg-white rounded-4xl border border-navy-100 flex flex-col h-full min-h-[500px] overflow-hidden shadow-sm">
      {/* Ticket Info Header */}
      <div className="p-6 border-b border-navy-50 bg-navy-50/30">
        <h2 className="text-lg font-bold text-navy-900 mb-1">{ticket.subject}</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-navy-400 font-medium">Ticket ID: #{ticket.id.slice(0, 8)}</span>
          <span className="w-1 h-1 rounded-full bg-navy-200"></span>
          <span className="text-navy-500 font-bold uppercase tracking-wider">{ticket.category}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isAdmin = msg.sender_role === 'admin';
          return (
            <div key={msg.id} className={`flex gap-4 ${isAdmin ? '' : 'flex-row-reverse'}`}>
              <div className="shrink-0 w-8 h-8 rounded-full bg-navy-50 border border-navy-100 overflow-hidden shadow-sm">
                {msg.sender?.profile_picture ? (
                  <img src={msg.sender.profile_picture} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-navy-400">
                    <MdPerson size={18} />
                  </div>
                )}
              </div>
              <div className={`max-w-[80%] flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                <div className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                  isAdmin 
                    ? 'bg-white border border-navy-100 text-navy-800 rounded-tl-none' 
                    : 'bg-navy-950 text-white rounded-tr-none'
                }`}>
                  {msg.attachment_type === 'image' && msg.attachment_data && (
                    <div className="mb-2">
                      <SignedSupportAttachmentImage
                        attachmentData={msg.attachment_data}
                        getSignedUrl={getSignedUrl}
                      />
                    </div>
                  )}
                  {msg.attachment_type === 'file' && msg.attachment_data && (
                    <SignedSupportAttachmentFile
                      attachmentData={msg.attachment_data}
                      getSignedUrl={getSignedUrl}
                      className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${
                        isAdmin ? 'bg-navy-50 text-navy-900' : 'bg-white/10 text-white'
                      }`}
                    >
                      <MdDescription size={24} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate text-xs">{msg.attachment_data.name}</div>
                        <div className="text-[10px] opacity-70">{msg.attachment_data.size}</div>
                      </div>
                    </SignedSupportAttachmentFile>
                  )}
                  {msg.content}
                </div>
                <span className="text-[10px] text-navy-400 mt-2 font-medium">
                  {isAdmin ? 'Support Agent' : 'You'} • {dayjs(msg.created_at).format('h:mm A')}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input - Only if ticket is not closed */}
      {ticket.status !== 'closed' ? (
        <div className="relative">
          <AnimatePresence>
            {attachmentParams && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-xl border border-navy-100 p-2 z-10 flex items-center gap-3 pr-4 max-w-xs"
              >
                {attachmentParams.type === 'image' && attachmentParams.url ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-navy-100">
                    <img src={attachmentParams.url} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-terracotta-500 shrink-0 border border-navy-100">
                    <MdDescription size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-navy-900 truncate">{attachmentParams.name}</p>
                </div>
                <button type="button" onClick={clearAttachment} className="p-1 hover:bg-navy-100 rounded-full text-navy-400">
                  <MdClose size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-navy-50 flex items-center gap-2">
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
              className="p-3 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-xl transition-colors"
            >
              <MdAttachFile size={22} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 bg-navy-50 border border-transparent focus:border-navy-200 rounded-xl px-5 py-3 text-sm focus:outline-none transition-all"
            />
            <button 
              type="submit" 
              disabled={(!input.trim() && !attachmentParams) || sending || isUploading}
              className="p-3 bg-navy-950 text-white rounded-xl hover:bg-navy-900 transition-all disabled:opacity-50 active:scale-95 shadow-md flex items-center justify-center min-w-[48px]"
            >
              {sending || isUploading ? <GlobalSpinner size="sm" color="white" /> : <MdSend size={20} />}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 text-center text-sm font-bold text-slate-500 uppercase tracking-widest border-t border-slate-100">
          This ticket is closed
        </div>
      )}
    </div>
  );
}

function SignedSupportAttachmentImage({ attachmentData, getSignedUrl }) {
  const [url, setUrl] = useState(attachmentData?.url || null);

  useEffect(() => {
    let alive = true;
    const path = attachmentData?.path;
    if (!url && path) {
      getSignedUrl(path).then((signed) => {
        if (!alive) return;
        if (signed) setUrl(signed);
      });
    }
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachmentData?.path]);

  if (!url) return <div className="w-48 h-32 bg-navy-50 rounded-lg animate-pulse" />;

  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="" className="max-w-full rounded-lg max-h-64 object-contain" />
    </a>
  );
}

function SignedSupportAttachmentFile({ attachmentData, getSignedUrl, className, children }) {
  const [url, setUrl] = useState(attachmentData?.url || null);

  useEffect(() => {
    let alive = true;
    const path = attachmentData?.path;
    if (!url && path) {
      getSignedUrl(path).then((signed) => {
        if (!alive) return;
        if (signed) setUrl(signed);
      });
    }
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachmentData?.path]);

  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noreferrer"
      aria-disabled={!url}
      onClick={(e) => { if (!url) e.preventDefault(); }}
      className={className}
    >
      {children}
    </a>
  );
}
