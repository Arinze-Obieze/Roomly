'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';

const ChatContext = createContext({});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [conversations, setConversations] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const supabase = createClient();
    const subscriptionRef = useRef(null);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false)
                .neq('sender_id', user.id); // Messages NOT sent by me
            
            if (error) throw error;
            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [user, supabase]);

    // Fetch user's conversations
    const fetchConversations = useCallback(async () => {
        if (!user) return;
        
        try {
            // Fetch conversations where user is host OR tenant
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    property:properties(id, title, city, state, property_media(url)),
                    tenant:users!tenant_id(id, full_name, profile_picture),
                    host:users!host_id(id, full_name, profile_picture)
                `)
                .or(`tenant_id.eq.${user.id},host_id.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;
            setConversations(data || []);
            
        } catch (error) {
            console.error('Error fetching conversations:', error);
            toast.error('Failed to load chats');
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    // Fetch messages for active conversation
    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;
        
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true }); // Oldest first for chat log

            if (error) throw error;
            setMessages(data || []);

            // Mark as read immediately when opening
            await markAsRead(conversationId);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [supabase]);

    const markAsRead = async (conversationId) => {
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', user.id) // Only mark others' messages as read
            .eq('is_read', false);
            
        fetchUnreadCount();
    };

    // Send a message
    const sendMessage = async (conversationId, content) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content
                })
                .select()
                .single();

            if (error) throw error;

            // Manually add to messages list immediately
            if (activeConversation === conversationId) {
                setMessages(prev => [...prev, data]);
            }

            // Optimistically update conversations last_message
            setConversations(prev => prev.map(c => 
                c.id === conversationId 
                    ? { ...c, last_message: content, last_message_at: new Date().toISOString() } 
                    : c
            ).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)));

            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
            return false;
        }
    };

    // Create new conversation
    const startConversation = async (propertyId, hostId, content) => {
        try {
            // Check existence first to be safe, though DB unique constraint exists
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .eq('property_id', propertyId)
                .eq('tenant_id', user.id)
                .single();

            let conversationId = existing?.id;

            if (!conversationId) {
                const { data: newConv, error } = await supabase
                    .from('conversations')
                    .insert({
                        property_id: propertyId,
                        tenant_id: user.id,
                        host_id: hostId,
                        last_message: content
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                conversationId = newConv.id;
            }

            // Send first message
            await sendMessage(conversationId, content);
            return conversationId;

        } catch (error) {
            console.error('Error starting conversation:', error);
            toast.error('Could not start chat');
            return null;
        }
    };

    // Real-time subscription setup
    useEffect(() => {
        if (!user) return;

        fetchConversations();
        fetchUnreadCount();

        // Subscribe to NEW conversations and UPDATES (messages)
        const sub = supabase
            .channel('public:conversations')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'conversations',
                filter: `tenant_id=eq.${user.id}` 
            }, () => {
                fetchConversations();
                fetchUnreadCount();
            })
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'conversations',
                filter: `host_id=eq.${user.id}` 
            }, () => {
                fetchConversations();
                fetchUnreadCount();
            })
            // Listen for new messages globally to update unread count
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                if (payload.new.sender_id !== user.id) {
                   fetchUnreadCount();
                }
                // Refresh conversations to update last_message preview
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(sub);
        };
    }, [user, fetchConversations, fetchUnreadCount, supabase]);

    // Active conversation message subscription
    useEffect(() => {
        if (!activeConversation) return;

        const sub = supabase
            .channel(`chat:${activeConversation}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConversation}`
            }, (payload) => {
                // Prevent duplicate if we already added it manually
                setMessages(prev => {
                    if (prev.some(m => m.id === payload.new.id)) return prev;
                    return [...prev, payload.new];
                });

                // If I am not the sender, mark as read
                if (payload.new.sender_id !== user.id) {
                    markAsRead(activeConversation);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(sub);
        };
    }, [activeConversation, user, supabase]);


    const value = {
        conversations,
        messages,
        loading,
        activeConversation,
        setActiveConversation,
        fetchMessages,
        sendMessage,
        startConversation
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
