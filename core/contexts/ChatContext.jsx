'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/core/utils/supabase/client';
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
    const activeConversationRef = useRef(activeConversation);

    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    // Fetch User's Conversations (Infinite)
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
        staleTime: 5 * 60 * 1000,
        placeholderData: (prev) => prev,
        refetchOnMount: false,
    });

    // Fetch Unread Count
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
        staleTime: 30 * 1000,
    });

    // Active Conversation Messages (Infinite Scroll)
    const messagesQuery = useInfiniteQuery({
        queryKey: ['messages', activeConversation],
        queryFn: async ({ pageParam = null }) => {
            if (!activeConversation) return [];
            
            const PAGE_SIZE = 50;
            const from = pageParam || 0;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', activeConversation)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            
            return data.reverse();
        },
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 50) return undefined;
            return allPages.length * 50;
        },
        enabled: !!activeConversation,
        staleTime: Infinity,
        placeholderData: (prev) => prev,
        refetchOnMount: false,
    });

    // Mark as Read Mutation
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

    // Trigger mark as read when messages load (only when conversation changes, NOT on every data update)
    useEffect(() => {
        if (activeConversation && messagesQuery.data?.pages?.[0]?.length > 0) {
            // Only call once per conversation change to avoid memory leaks
            markReadMutation.mutate(activeConversation);
        }
    }, [activeConversation]);

    // Send Message Mutation (Optimistic)
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
            await queryClient.cancelQueries(['messages', conversationId]);

            const previousMessages = queryClient.getQueryData(['messages', conversationId]);

            queryClient.setQueryData(['messages', conversationId], (old) => {
                if (!old) return { pages: [[]], pageParams: [] };
                
                const newMessage = {
                    id: 'temp-' + Date.now(),
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content,
                    created_at: new Date().toISOString(),
                    is_read: false
                };

                const newPages = [...old.pages];
                const lastPageIndex = newPages.length - 1;
                newPages[lastPageIndex] = [...newPages[lastPageIndex], newMessage];
                
                return { ...old, pages: newPages };
            });

            queryClient.setQueryData(['conversations', user?.id], (old) => {
                if (!old || !old.pages) return old;
                
                const newPages = old.pages.map(page => 
                    page.map(c => 
                        c.id === conversationId 
                        ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
                        : c
                    )
                );
                
                return { ...old, pages: newPages };
            });

            return { previousMessages };
        },
        onError: (err, newTodo, context) => {
            toast.error('Failed to send');
            if (context?.previousMessages) {
                queryClient.setQueryData(['messages', newTodo.conversationId], context.previousMessages);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries(['messages', variables.conversationId]);
            queryClient.invalidateQueries(['conversations', user?.id]);
            queryClient.invalidateQueries(['unread-count', user?.id]);
        }
    });

    // Start Conversation Mutation
    const startConversationMutation = useMutation({
        mutationFn: async ({ propertyId, hostId, content }) => {
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .eq('property_id', propertyId)
                .eq('tenant_id', user.id)
                .single();

            if (existing) {
                await sendMessageMutation.mutateAsync({ conversationId: existing.id, content });
                return existing.id;
            }

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
            
            await sendMessageMutation.mutateAsync({ conversationId: newConv.id, content });
            return newConv.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['conversations', user?.id]);
        },
        onError: () => toast.error('Failed to start chat')
    });

    // Realtime Subscriptions
    useEffect(() => {
        if (!user) return;

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
                
                if (msg.sender_id !== user.id) {
                    queryClient.invalidateQueries(['unread-count', user.id]);
                }
                
                const currentConversation = activeConversationRef.current;

                if (currentConversation && msg.conversation_id === currentConversation) {
                    queryClient.setQueryData(['messages', currentConversation], (old) => {
                        if (!old) return old;
                        const pages = [...old.pages];
                        const lastPage = pages[pages.length - 1];
                        
                        if (lastPage.some(m => m.id === msg.id)) return old;

                        pages[pages.length - 1] = [...lastPage, msg];
                        return { ...old, pages };
                    });
                    
                    if (msg.sender_id !== user.id) {
                        markReadMutation.mutate(currentConversation);
                    }
                }

                queryClient.invalidateQueries(['conversations', user.id]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    const conversationMessages = messagesQuery.data 
        ? messagesQuery.data.pages.flat() 
        : [];
    
    const conversationsList = conversationsQuery.data
        ? conversationsQuery.data.pages.flat()
        : [];

    const value = {
        conversations: conversationsList,
        messages: conversationMessages,
        loading: conversationsQuery.isLoading && conversationsList.length === 0,
        
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
