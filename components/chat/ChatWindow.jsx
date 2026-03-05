'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/core/contexts/ChatContext';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdSend, MdMoreVert, MdArrowBack, MdCheckCircle, MdDoneAll, MdAttachFile, MdClose, MdDescription, MdCloudUpload, MdAccessTime } from 'react-icons/md';
import { format } from 'date-fns';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { createClient } from '@/core/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import bytes from 'bytes';

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
    const [isUploading, setIsUploading] = useState(false);
    const [attachmentParams, setAttachmentParams] = useState(null);
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [prevScrollHeight, setPrevScrollHeight] = useState(null);
    const supabase = createClient();

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

    const uploadFileProcess = async (file) => {
        try {
            const lastDot = file.name.lastIndexOf('.');
            const fileExt = lastDot !== -1 ? file.name.slice(lastDot + 1) : '';
            const fileName = fileExt ? `${uuidv4()}.${fileExt}` : uuidv4();
            const filePath = `${activeConversation}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('message_attachments')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('message_attachments')
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
        if ((!newMessage.trim() && !attachmentParams) || sending || isUploading) return;

        const content = newMessage;
        const prevAttachmentParams = attachmentParams;
        const isFile = !!attachmentParams?.fileObj;
        
        setNewMessage('');
        setSending(true);
        setAttachmentParams(null);

        let finalAttachmentType = null;
        let finalAttachmentData = null;
        let uploadedFilePath = null;

        try {
            if (isFile) {
                setIsUploading(true);
                const uploadResult = await uploadFileProcess(prevAttachmentParams.fileObj);
                setIsUploading(false);
                
                if (!uploadResult) {
                    setNewMessage(content);
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

            await sendMessage(activeConversation, content.trim() ? content : null, finalAttachmentType, finalAttachmentData);
            
            if (prevAttachmentParams?.url && prevAttachmentParams.type === 'image') {
                URL.revokeObjectURL(prevAttachmentParams.url);
            }
        } catch (error) {
            console.error(error);
            setNewMessage(content);
            setAttachmentParams(prevAttachmentParams);
            
            if (uploadedFilePath) {
                await supabase.storage.from('message_attachments').remove([uploadedFilePath]);
            }
            toast.error('Failed to send message');
        } finally {
            setSending(false);
            setIsUploading(false);
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
                                    
                                    <div className={`max-w-[70%] rounded-2xl p-1.5 shadow-sm text-sm font-sans break-words ${
                                        isMyMsg 
                                            ? 'bg-terracotta-500 text-white rounded-tr-none shadow-lg shadow-terracotta-500/20' 
                                            : 'bg-white border border-navy-200 text-navy-800 rounded-tl-none'
                                    }`}>
                                        {msg.attachment_type === 'image' && msg.attachment_data ? (
                                            <div className="mb-1">
                                                <a href={msg.attachment_data.url} target="_blank" rel="noreferrer">
                                                    <img 
                                                        src={msg.attachment_data.url} 
                                                        alt={msg.attachment_data.name} 
                                                        className="w-full h-auto rounded-xl max-h-60 object-cover cursor-ZoomIn hover:opacity-95 transition-opacity"
                                                    />
                                                </a>
                                            </div>
                                        ) : msg.attachment_type === 'file' && msg.attachment_data ? (
                                            <div className="mb-1">
                                                <a 
                                                    href={msg.attachment_data.url} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors group/file cursor-pointer ${
                                                        isMyMsg ? 'bg-terracotta-600 hover:bg-terracotta-700' : 'bg-navy-50 hover:bg-navy-100'
                                                    }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-lg shadow-sm flex items-center justify-center group-hover/file:scale-105 transition-transform ${
                                                        isMyMsg ? 'bg-white/20 text-white' : 'bg-white text-terracotta-500'
                                                    }`}>
                                                        <MdDescription size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm truncate">{msg.attachment_data.name}</h4>
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isMyMsg ? 'text-terracotta-100' : 'text-navy-400'}`}>
                                                            {msg.attachment_data.size}
                                                        </p>
                                                    </div>
                                                </a>
                                            </div>
                                        ) : null}
                                        
                                        {msg.content && (
                                            <div className={`px-2.5 py-1 ${msg.attachment_type ? 'mt-1' : ''}`}>
                                                {msg.content}
                                            </div>
                                        )}
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
                className="p-4 bg-white border-t border-navy-200 shrink-0 sticky bottom-0 z-20 relative"
            >
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

                <div className="max-w-3xl mx-auto">
                    <div className="flex items-end gap-2">
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
                            className="mb-1 p-2.5 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-xl transition-colors shrink-0"
                        >
                            <MdAttachFile size={22} />
                        </button>
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
                                disabled={(!newMessage.trim() && !attachmentParams) || sending || isUploading}
                                className="absolute right-2 bottom-2 p-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 disabled:opacity-50 disabled:hover:bg-terracotta-500 transition-all shadow-lg shadow-terracotta-500/20"
                            >
                                {sending || isUploading ? (
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
