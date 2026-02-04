'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

const ChatContext = createContext({});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [activeConversation, setActiveConversation] = useState(null);
    const supabase = createClient();
    const queryClient = useQueryClient();

    // 1. Fetch User's Conversations
    // 1. Fetch User's Conversations (Infinite)
    const conversationsQuery = useInfiniteQuery({
        queryKey: ['conversations', user?.id],
        queryFn: async ({ pageParam = 0 }) => {
             if (!user) return [];
             const PAGE_SIZE = 20;
             const from = pageParam;
             const to = from + PAGE_SIZE - 1;

             const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    property:properties(id, title, city, state, property_media(url)),
                    tenant:users!tenant_id(id, full_name, profile_picture),
                    host:users!host_id(id, full_name, profile_picture)
                `)
                .or(`tenant_id.eq.${user.id},host_id.eq.${user.id}`)
                .order('last_message_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
             if (lastPage.length < 20) return undefined;
             return allPages.length * 20;
        },
        enabled: !!user,
        staleTime: 60 * 1000, 
    });

    // 2. Fetch Unread Count
    const unreadCountQuery = useQuery({
        queryKey: ['unread-count', user?.id],
        queryFn: async () => {
             if (!user) return 0;
             const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false)
                .neq('sender_id', user.id);
            
            if (error) throw error;
            return count || 0;
        },
        enabled: !!user,
        // Refetch often or rely on realtime
        staleTime: 30 * 1000,
    });

    // 3. Active Conversation Messages (Infinite Scroll)
    const messagesQuery = useInfiniteQuery({
        queryKey: ['messages', activeConversation],
        queryFn: async ({ pageParam = null }) => {
            if (!activeConversation) return [];
            
            // Cursor-based / Range-based pagination
            // 0-49, 50-99, etc.
            const PAGE_SIZE = 50;
            const from = pageParam || 0;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', activeConversation)
                .order('created_at', { ascending: false }) // Fetch NEWEST first for chat
                .range(from, to);

            if (error) throw error;
            
            // Reverse here so they display oldest->newest in the list if needed, 
            // OR keep desc and use flex-col-reverse. 
            // Usually standard chats use flex-col and data ascending.
            // But for pagination, it's easier to fetch desc (latest first).
            return data.reverse(); 
        },
        getNextPageParam: (lastPage, allPages) => {
             if (lastPage.length < 50) return undefined; // No more pages
             return allPages.length * 50; // Next cursor (offset)
        },
        enabled: !!activeConversation,
        staleTime: Infinity, // Messages don't change historically often
    });

    // 4. Mark as Read Mutation
    const markReadMutation = useMutation({
        mutationFn: async (conversationId) => {
             if (!user) return;
             await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', user.id)
                .eq('is_read', false);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['unread-count', user?.id]);
        }
    });

    // Trigger mark as read when messages load and active convo changes
    useEffect(() => {
        if (activeConversation && messagesQuery.data?.pages?.[0]?.length > 0) {
            markReadMutation.mutate(activeConversation);
        }
    }, [activeConversation, messagesQuery.dataUpdatedAt]); // Run when data refreshes


    // 5. Send Message Mutation (Optimistic)
    const sendMessageMutation = useMutation({
        mutationFn: async ({ conversationId, content }) => {
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
            return data;
        },
        onMutate: async ({ conversationId, content }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries(['messages', conversationId]);

            // Snapshot previous value
            const previousMessages = queryClient.getQueryData(['messages', conversationId]);

            // Optimistically update
            queryClient.setQueryData(['messages', conversationId], (old) => {
                if (!old) return { pages: [[]], pageParams: [] };
                
                // Create optimistic message
                const newMessage = {
                    id: 'temp-' + Date.now(),
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content,
                    created_at: new Date().toISOString(),
                    is_read: false
                };

                // Add to the LAST page (most recent)
                const newPages = [...old.pages];
                const lastPageIndex = newPages.length - 1;
                newPages[lastPageIndex] = [...newPages[lastPageIndex], newMessage];
                
                return { ...old, pages: newPages };
            });

            // Optimistically update conversations list last_message
            const previousConversations = queryClient.getQueryData(['conversations', user?.id]);
            
            queryClient.setQueryData(['conversations', user?.id], (old) => {
                if (!old || !old.pages) return old;
                
                // We need to find the conversation in the pages, update it, and potentially move it to top.
                // Moving to top in infinite query pages is complex. 
                // For optimistic UI, strictly updating the content is safer/easier than reordering across pages.
                // However, users expect it to jump to top.
                // Let's just update the specific conversation for now to fix the crash.
                
                const newPages = old.pages.map(page => 
                    page.map(c => 
                        c.id === conversationId 
                        ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
                        : c
                    )
                );
                
                return { ...old, pages: newPages };
            });

            return { previousMessages, previousConversations };
        },
        onError: (err, newTodo, context) => {
            toast.error('Failed to send');
            if (context?.previousMessages) {
                queryClient.setQueryData(['messages', newTodo.conversationId], context.previousMessages);
            }
            if (context?.previousConversations) {
                queryClient.setQueryData(['conversations', user?.id], context.previousConversations);
            }
        },
        onSettled: (data, error, variables) => {
            // Invalidate to refetch real ID
            queryClient.invalidateQueries(['messages', variables.conversationId]);
            queryClient.invalidateQueries(['conversations', user?.id]);
        }
    });

    // 6. Start Conversation Mutation
    const startConversationMutation = useMutation({
        mutationFn: async ({ propertyId, hostId, content }) => {
             // Check existing (could optimize this into DB function or rely on unique constraint)
             const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .eq('property_id', propertyId)
                .eq('tenant_id', user.id)
                .single();

            if (existing) {
                // Return existing ID
                await sendMessageMutation.mutateAsync({ conversationId: existing.id, content });
                return existing.id;
            }

            // Create new
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
            
            // Send first message
            await sendMessageMutation.mutateAsync({ conversationId: newConv.id, content });
            return newConv.id;
        },
        onSuccess: () => {
             queryClient.invalidateQueries(['conversations', user?.id]);
        },
        onError: () => toast.error('Failed to start chat')
    });


    // 7. Realtime Subscriptions
    useEffect(() => {
        if (!user) return;

        // Conversations Channel
        const channel = supabase
            .channel('global-chat-updates')
            .on('postgres_changes', { 
                event: '*', schema: 'public', table: 'conversations', 
                filter: `tenant_id=eq.${user.id}` 
            }, () => queryClient.invalidateQueries(['conversations', user.id]))
            .on('postgres_changes', { 
                event: '*', schema: 'public', table: 'conversations', 
                filter: `host_id=eq.${user.id}` 
            }, () => queryClient.invalidateQueries(['conversations', user.id]))
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'messages'
            }, (payload) => {
                const msg = payload.new;
                // If message is for one of my conversations (we don't know easily without filtering, 
                // but we can check if it belongs to active chat)
                
                // Update Unread Count if not me
                if (msg.sender_id !== user.id) {
                     queryClient.invalidateQueries(['unread-count', user.id]);
                }
                
                // If it is the active conversation, insert it into cache (Realtime Optimistic)
                if (activeConversation && msg.conversation_id === activeConversation) {
                     queryClient.setQueryData(['messages', activeConversation], (old) => {
                         if (!old) return old;
                         // Dedup based on ID or temp-ID (basic check)
                         const pages = [...old.pages];
                         const lastPage = pages[pages.length - 1];
                         
                         if (lastPage.some(m => m.id === msg.id)) return old;

                         // Append
                         pages[pages.length - 1] = [...lastPage, msg];
                         return { ...old, pages };
                     });
                     
                     // Mark as read immediately
                     if (msg.sender_id !== user.id) {
                         markReadMutation.mutate(activeConversation);
                     }
                }

                // Invalidate conversations to show new last_msg
                queryClient.invalidateQueries(['conversations', user.id]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, activeConversation, queryClient]); // Re-subscribe if active change is okay?? 
    // Ideally we want one global sub and specific sub? 
    // Simplified: One global sub handles mostly everything. 
    // The specific message insertion logic handles active chat visual updates.


    // Flatten data for consumers
    const conversationMessages = messagesQuery.data 
        ? messagesQuery.data.pages.flat() 
        : [];
    
    // Safety check for conversationsQuery structure
    const conversationsList = conversationsQuery.data
        ? conversationsQuery.data.pages.flat()
        : [];

    const value = {
        conversations: conversationsList,
        messages: conversationMessages,
        loading: conversationsQuery.isLoading, 
        
        // Conversation Pagination
        fetchNextConversations: conversationsQuery.fetchNextPage,
        hasNextConversations: conversationsQuery.hasNextPage,
        isFetchingNextConversations: conversationsQuery.isFetchingNextPage,

        isLoadingMessages: messagesQuery.isLoading,
        isFetchingNextPage: messagesQuery.isFetchingNextPage,
        hasNextPage: messagesQuery.hasNextPage,
        fetchNextPage: messagesQuery.fetchNextPage,
        
        activeConversation,
        setActiveConversation,
        
        sendMessage: (conversationId, content) => sendMessageMutation.mutateAsync({ conversationId, content }),
        startConversation: (pid, hid, content) => startConversationMutation.mutateAsync({ propertyId: pid, hostId: hid, content }),
        
        unreadCount: unreadCountQuery.data || 0
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
