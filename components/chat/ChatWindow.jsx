'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/core/contexts/ChatContext';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { useConfirmation } from '@/core/contexts/ConfirmationContext';
import { 
    MdSend, MdMoreVert, MdArrowBack, MdCheckCircle, MdDoneAll, MdAttachFile, MdClose, 
    MdDescription, MdCloudUpload, MdAccessTime, MdEvent, MdEdit, MdArchive, MdDone,
    MdCheck, MdDelete
} from 'react-icons/md';
import { format, differenceInMilliseconds } from 'date-fns';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { createClient } from '@/core/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import bytes from 'bytes';
import { ScheduleInspectionModal } from './ScheduleInspectionModal';

export const ChatWindow = () => {
    const { 
        activeConversation, 
        setActiveConversation,
        messages, 
        sendMessage,
        editMessage,
        archiveConversation,
        deleteConversation,
        conversations,
        allConversations,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoadingMessages,
        EDIT_WINDOW_MS
    } = useChat();
    const { user } = useAuthContext();
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [attachmentParams, setAttachmentParams] = useState(null);
    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [signedUrlByPath, setSignedUrlByPath] = useState({});

    // Editing state
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [hoveredMessageId, setHoveredMessageId] = useState(null);

    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const editInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const headerMenuRef = useRef(null);
    const [prevScrollHeight, setPrevScrollHeight] = useState(null);
    const supabase = createClient();
    const { confirm } = useConfirmation();

    // Look up from allConversations so archived chats still show correct header info
    const conversation = (allConversations ?? conversations).find(c => c.id === activeConversation);
    const otherParty = conversation ? (conversation.tenant_id === user?.id ? conversation.host : conversation.tenant) : null;
    const isArchivedConversation = (conversation?.archived_by ?? []).includes(user?.id);
    const isMe = (msg) => msg.sender_id === user.id;

    // Close header menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
                setShowHeaderMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus edit input when editing starts
    useEffect(() => {
        if (editingMessageId && editInputRef.current) {
            editInputRef.current.focus();
            const length = editInputRef.current.value.length;
            editInputRef.current.setSelectionRange(length, length);
        }
    }, [editingMessageId]);

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
            return { filePath };
        } catch (error) {
            console.error('Upload Error:', error);
            toast.error('Failed to upload file');
            return null;
        }
    };

    const getSignedUrl = async (path) => {
        if (!path) return null;
        if (signedUrlByPath[path]) return signedUrlByPath[path];
        try {
            const res = await fetch(`/api/messages/attachment-url?conversationId=${activeConversation}&path=${encodeURIComponent(path)}`);
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

    // --- Message Edit Handlers ---
    const canEdit = (msg) => {
        if (!isMe(msg)) return false;
        if (msg.attachment_type && msg.attachment_type !== null) return false; // Only text-only messages
        const msSinceSent = differenceInMilliseconds(new Date(), new Date(msg.created_at));
        return msSinceSent < EDIT_WINDOW_MS;
    };

    const startEditing = (msg) => {
        setEditingMessageId(msg.id);
        setEditContent(msg.content || '');
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const commitEdit = async (msg) => {
        const trimmed = editContent.trim();
        if (!trimmed || trimmed === msg.content) {
            cancelEditing();
            return;
        }
        try {
            await editMessage(msg.id, activeConversation, trimmed);
            cancelEditing();
        } catch (e) {
            // Toast shown in context
        }
    };

    // --- Archive Handler ---
    const handleArchiveToggle = async () => {
        setShowHeaderMenu(false);
        try {
            const shouldArchive = !isArchivedConversation;
            await archiveConversation(activeConversation, shouldArchive);
            if (shouldArchive) setActiveConversation(null);
        } catch (e) {
            // Toast shown in context
        }
    };

    const handleDelete = async () => {
        setShowHeaderMenu(false);
        const isConfirmed = await confirm({
            title: 'Delete chat?',
            message: 'This will permanently delete the chat and all messages for both participants.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });
        if (!isConfirmed) return;

        setIsDeleting(true);
        try {
            await deleteConversation(activeConversation);
            setActiveConversation(null);
        } catch (e) {
            // Toast shown in context
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Inspection Handlers ---
    const handleInspectionSubmit = async (data) => {
        try {
            const payload = {
                conversationId: activeConversation,
                propertyId: conversation?.property?.id,
                hostId: conversation?.host_id,
                tenantId: conversation?.tenant_id,
                date: data.date,
                time: data.time,
                note: data.note,
                seekerName: user.full_name,
                propertyTitle: conversation?.property?.title || 'Property'
            };

            const response = await fetch('/api/inspections/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to request inspection');
            toast.success('Inspection requested successfully!');
        } catch (error) {
            console.error('Submit inspection error:', error);
            toast.error('Failed to request inspection');
        }
    };

    const handleInspectionAction = async (msgId, newStatus, proposedDate = null, proposedTime = null) => {
        try {
            const currentMsg = messages.find(m => m.id === msgId);
            if (!currentMsg) return;

            const otherPartyId = user.id === conversation.host_id ? conversation.tenant_id : conversation.host_id;
            const payload = {
                messageId: msgId, newStatus, conversationId: activeConversation,
                updaterId: user.id, otherPartyId,
                propertyTitle: conversation?.property?.title || 'Property',
                date: proposedDate, time: proposedTime
            };

            const response = await fetch('/api/inspections/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to update inspection');
            toast.success(`Inspection ${newStatus} successfully!`);
        } catch (error) {
            console.error('Update inspection error:', error);
            toast.error('Failed to update inspection status');
        }
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
                    path: uploadResult.filePath,
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
                
                {/* Header Actions Menu */}
                <div className="relative" ref={headerMenuRef}>
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowHeaderMenu(v => !v)}
                        className="p-2 hover:bg-navy-50 rounded-full text-navy-500 transition-colors shrink-0"
                    >
                        <MdMoreVert size={24} />
                    </motion.button>

                    <AnimatePresence>
                        {showHeaderMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-navy-100 overflow-hidden z-30"
                            >
                                <button
                                    onClick={handleArchiveToggle}
                                    className="w-full px-4 py-3 text-sm text-left flex items-center gap-3 text-navy-700 hover:bg-navy-50 transition-colors font-heading font-medium"
                                >
                                    {isArchivedConversation ? (
                                        <>
                                            <MdDone className="text-teal-500" size={18} />
                                            Restore Chat
                                        </>
                                    ) : (
                                        <>
                                            <MdArchive className="text-navy-400" size={18} />
                                            Archive Chat
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full px-4 py-3 text-sm text-left flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors font-heading font-medium disabled:opacity-60"
                                >
                                    {isDeleting ? (
                                        <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <MdDelete className="text-red-500" size={18} />
                                    )}
                                    Delete Chat
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Scrollable Messages Area */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 md:px-6 py-4"
            >
                <div className="max-w-3xl mx-auto space-y-4">

                    {/* Message loading skeleton — only while no messages loaded yet */}
                    {isLoadingMessages && messages.length === 0 && (
                        <div className="space-y-5 py-2">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex flex-col gap-1 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`animate-pulse rounded-2xl ${
                                                i % 2 === 0 ? 'bg-terracotta-200 rounded-tr-none' : 'bg-navy-200 rounded-tl-none'
                                            }`}
                                            style={{
                                                width: `${120 + (i * 37) % 160}px`,
                                                height: `${32 + (i * 13) % 28}px`
                                            }}
                                        />
                                        <div className="w-12 h-2.5 bg-navy-100 rounded-full animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                            const isEditing = editingMessageId === msg.id;
                            const hovered = hoveredMessageId === msg.id;
                            const editable = canEdit(msg);

                            return (
                                <motion.div 
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'}`}
                                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                                    onMouseLeave={() => setHoveredMessageId(null)}
                                >
                                    {showTime && (
                                        <span className="text-xs font-sans text-navy-400 my-2 self-center bg-white px-2 py-1 rounded-full border border-navy-100">
                                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                                        </span>
                                    )}
                                    
                                    <div className={`relative group max-w-[70%] flex items-end gap-1.5 ${isMyMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Edit button for my messages — shown on hover */}
                                        {isMyMsg && editable && hovered && !isEditing && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                onClick={() => startEditing(msg)}
                                                className="p-1.5 rounded-full bg-white border border-navy-200 shadow-sm text-navy-400 hover:text-terracotta-500 hover:border-terracotta-300 transition-colors shrink-0 mb-4"
                                                title="Edit message"
                                            >
                                                <MdEdit size={14} />
                                            </motion.button>
                                        )}

                                        <div className={`rounded-2xl p-1.5 shadow-sm text-sm font-sans break-words ${
                                            isMyMsg 
                                                ? 'bg-terracotta-500 text-white rounded-tr-none shadow-lg shadow-terracotta-500/20' 
                                                : 'bg-white border border-navy-200 text-navy-800 rounded-tl-none'
                                        }`}>
                                            {msg.attachment_type === 'image' && msg.attachment_data ? (
                                                <div className="mb-1">
                                                    <SignedMessageAttachmentImage
                                                        attachmentData={msg.attachment_data}
                                                        getSignedUrl={getSignedUrl}
                                                    />
                                                </div>
                                            ) : msg.attachment_type === 'file' && msg.attachment_data ? (
                                                <div className="mb-1">
                                                    <SignedMessageAttachmentFile
                                                        attachmentData={msg.attachment_data}
                                                        getSignedUrl={getSignedUrl}
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
                                                    </SignedMessageAttachmentFile>
                                                </div>
                                            ) : msg.attachment_type === 'inspection_request' && msg.attachment_data ? (
                                                <div className="mb-2 p-3 bg-white border border-navy-100 rounded-xl shadow-sm text-navy-900 w-64 space-y-3">
                                                    <div className="font-bold font-heading text-[15px] pb-2 border-b border-navy-50 flex items-center justify-between">
                                                        <span>Inspection Request</span>
                                                        {msg.attachment_data.status === 'pending' && <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-md">Pending</span>}
                                                        {msg.attachment_data.status === 'confirmed' && <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">Confirmed</span>}
                                                        {msg.attachment_data.status === 'declined' && <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">Declined</span>}
                                                        {msg.attachment_data.status === 'rescheduled' && <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Proposed</span>}
                                                    </div>
                                                    
                                                    <div className="space-y-1.5 text-xs">
                                                        <p className="flex items-center gap-2"><MdEvent className="text-navy-400" size={16}/> <span className="font-medium">{format(new Date(msg.attachment_data.date), 'MMM d, yyyy')}</span></p>
                                                        <p className="flex items-center gap-2"><MdAccessTime className="text-navy-400" size={16}/> <span className="font-medium">{msg.attachment_data.time}</span></p>
                                                        {msg.attachment_data.note && (
                                                            <p className="mt-2 text-navy-600 italic bg-navy-50 p-2 rounded-lg">"{msg.attachment_data.note}"</p>
                                                        )}
                                                    </div>

                                                    {(msg.attachment_data.status === 'pending' || (msg.attachment_data.status === 'rescheduled' && msg.attachment_data.proposed_by !== user.id)) && (
                                                        <div className="pt-2 border-t border-navy-50 flex flex-col gap-2 mt-2">
                                                            {((msg.attachment_data.status === 'pending' && user.id === conversation.host_id) || 
                                                              (msg.attachment_data.status === 'rescheduled' && user.id !== msg.attachment_data.proposed_by)) ? (
                                                                <>
                                                                    <button onClick={() => handleInspectionAction(msg.id, 'confirmed')} className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg text-xs transition-colors shadow-sm">Accept Request</button>
                                                                    <button onClick={() => handleInspectionAction(msg.id, 'declined')} className="w-full py-2 bg-navy-50 hover:bg-navy-100 text-navy-600 font-bold rounded-lg text-xs transition-colors">Decline</button>
                                                                </>
                                                            ) : (
                                                                <div className="text-center text-xs font-medium text-navy-500 py-1">Waiting for response...</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {msg.attachment_data.status === 'confirmed' && (
                                                        <div className="pt-2 border-t border-navy-50 flex items-center justify-center gap-1.5 text-teal-600 text-xs font-bold mt-2">
                                                            <MdCheckCircle size={14} /> See you then!
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}

                                            {/* Message content (text) - show inline edit if editing */}
                                            {isEditing ? (
                                                <div className="px-2 py-1 flex items-center gap-1.5">
                                                    <textarea
                                                        ref={editInputRef}
                                                        value={editContent}
                                                        onChange={e => setEditContent(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                commitEdit(msg);
                                                            }
                                                            if (e.key === 'Escape') cancelEditing();
                                                        }}
                                                        className="bg-terracotta-600 text-white text-sm rounded-lg px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-white/30 min-w-[120px]"
                                                        rows={1}
                                                        style={{ minHeight: '28px', maxHeight: '100px' }}
                                                    />
                                                    <button onClick={() => commitEdit(msg)} className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors shrink-0">
                                                        <MdCheck size={14} className="text-white" />
                                                    </button>
                                                    <button onClick={cancelEditing} className="p-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors shrink-0">
                                                        <MdClose size={14} className="text-white/80" />
                                                    </button>
                                                </div>
                                            ) : msg.content && (
                                                <div className={`px-2.5 py-1 ${msg.attachment_type ? 'mt-1' : ''}`}>
                                                    {msg.content}
                                                    {msg.is_edited && (
                                                        <span className={`text-[10px] ml-1.5 opacity-70 italic`}>edited</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
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
                    <div className="flex items-end gap-1">
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
                            className="mb-1 p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-xl transition-colors shrink-0"
                            title="Attach File"
                        >
                            <MdAttachFile size={22} />
                        </button>
                        
                        {user?.id === conversation?.tenant_id && (
                            <button 
                                type="button" 
                                onClick={() => setIsInspectionModalOpen(true)}
                                className="mb-1 p-2 text-navy-400 hover:text-terracotta-500 hover:bg-terracotta-50 rounded-xl transition-colors shrink-0 mr-1"
                                title="Schedule Inspection"
                            >
                                <MdEvent size={22} />
                            </button>
                        )}
                        
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

            <ScheduleInspectionModal 
                isOpen={isInspectionModalOpen} 
                onClose={() => setIsInspectionModalOpen(false)} 
                onSubmit={handleInspectionSubmit} 
            />
        </div>
    );
};

function SignedMessageAttachmentImage({ attachmentData, getSignedUrl }) {
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

    if (!url) {
        return <div className="w-56 h-40 bg-white/10 rounded-xl animate-pulse" />;
    }

    return (
        <a href={url} target="_blank" rel="noreferrer">
            <img
                src={url}
                alt={attachmentData?.name || 'Attachment'}
                className="w-full h-auto rounded-xl max-h-60 object-cover cursor-ZoomIn hover:opacity-95 transition-opacity"
            />
        </a>
    );
}

function SignedMessageAttachmentFile({ attachmentData, getSignedUrl, className, children }) {
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
