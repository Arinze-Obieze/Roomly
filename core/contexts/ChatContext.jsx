'use client';

import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

const ChatContext = createContext({});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [activeConversation, setActiveConversation] = useState(null);
    const supabase = useMemo(() => createClient(), []);
    const queryClient = useQueryClient();
    const activeConversationRef = useRef(activeConversation);

    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    const mergeConversationIntoCache = (conversation) => {
        if (!conversation || !user?.id) return;

        queryClient.setQueryData(['conversations', user.id], (old) => {
            if (!old?.pages) {
                return {
                    pages: [[conversation]],
                    pageParams: [null],
                };
            }

            const flattened = old.pages.flat();
            const withoutCurrent = flattened.filter((item) => item.id !== conversation.id);
            const nextList = [conversation, ...withoutCurrent].sort((a, b) => {
                const aTime = new Date(a.last_message_at || a.created_at || 0).getTime();
                const bTime = new Date(b.last_message_at || b.created_at || 0).getTime();
                return bTime - aTime;
            });

            const firstPageSize = old.pages[0]?.length || 20;
            const nextPages = [];
            for (let i = 0; i < nextList.length; i += firstPageSize) {
                nextPages.push(nextList.slice(i, i + firstPageSize));
            }

            return {
                ...old,
                pages: nextPages,
            };
        });
    };

    const fetchConversationById = async (conversationId) => {
        if (!user || !conversationId) return null;

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                property:properties(id, title, city, state, property_media(url)),
                tenant:users!tenant_id(id, full_name, profile_picture),
                host:users!host_id(id, full_name, profile_picture)
            `)
            .eq('id', conversationId)
            .or(`tenant_id.eq.${user.id},host_id.eq.${user.id}`)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const normalizedConversation = {
            ...data,
            unread_count: data.tenant_id === user?.id ? data.unread_count_tenant : data.unread_count_host
        };

        mergeConversationIntoCache(normalizedConversation);
        return normalizedConversation;
    };

    // Fetch User's Conversations (Infinite)
    const conversationsQuery = useInfiniteQuery({
        queryKey: ['conversations', user?.id],
        queryFn: async ({ pageParam = null }) => {
            if (!user) return [];
            const PAGE_SIZE = 20;
            const cursor = pageParam && typeof pageParam === 'object' ? pageParam : null;

            let q = supabase
                .from('conversations')
                .select(`
                    *,
                    property:properties(id, title, city, state, property_media(url)),
                    tenant:users!tenant_id(id, full_name, profile_picture),
                    host:users!host_id(id, full_name, profile_picture)
                `)
                .or(`tenant_id.eq.${user.id},host_id.eq.${user.id}`)
                .order('last_message_at', { ascending: false })
                .limit(PAGE_SIZE);

            // Keyset pagination by timestamp (avoids large offset scans).
            // Note: ties on the same timestamp are rare; if needed, add an RPC for strict keyset with (last_message_at, id).
            if (cursor?.last_message_at) {
                q = q.lt('last_message_at', cursor.last_message_at);
            }

            const { data, error } = await q;

            if (error) throw error;
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 20) return undefined;
            const last = lastPage[lastPage.length - 1];
            if (!last?.last_message_at) return undefined;
            return { last_message_at: last.last_message_at };
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
        placeholderData: (prev) => prev,
        refetchOnMount: false,
    });

    // Fetch total unread count (fast RPC, avoids scanning messages)
    const unreadCountQuery = useQuery({
        queryKey: ['chat-unread-count', user?.id],
        queryFn: async () => {
            if (!user) return 0;
            const { data, error } = await supabase.rpc('get_chat_unread_count');
            if (error) throw error;
            return data || 0;
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
            const cursor = pageParam && typeof pageParam === 'object' ? pageParam : null;

            let q = supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', activeConversation)
                .order('created_at', { ascending: false })
                .order('id', { ascending: false })
                .limit(PAGE_SIZE);

            if (cursor?.created_at && cursor?.id) {
                q = q.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
            }

            const { data, error } = await q;

            if (error) throw error;
            
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < 50) return undefined;
            const last = lastPage[lastPage.length - 1];
            if (!last?.created_at || !last?.id) return undefined;
            return { created_at: last.created_at, id: last.id };
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
            queryClient.invalidateQueries(['chat-unread-count', user?.id]);
            queryClient.invalidateQueries(['conversations', user?.id]);
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
        mutationFn: async ({ conversationId, content, attachmentType = null, attachmentData = null }) => {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content,
                    attachmentType,
                    attachmentData,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || 'Failed to send message');
            }

            return payload.data;
        },
        onMutate: async ({ conversationId, content, attachmentType = null, attachmentData = null }) => {
            await queryClient.cancelQueries(['messages', conversationId]);

            const previousMessages = queryClient.getQueryData(['messages', conversationId]);

            queryClient.setQueryData(['messages', conversationId], (old) => {
                if (!old) return { pages: [[]], pageParams: [] };
                
                const newMessage = {
                    id: 'temp-' + Date.now(),
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content,
                    attachment_type: attachmentType,
                    attachment_data: attachmentData,
                    created_at: new Date().toISOString(),
                    is_read: false
                };

                const newPages = [...old.pages];
                if (newPages.length === 0) newPages.push([]);
                // We paginate newest → older (DESC), so new messages belong at the start.
                newPages[0] = [newMessage, ...(newPages[0] || [])];
                
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
            toast.error(err?.message || 'Failed to send');
            if (context?.previousMessages) {
                queryClient.setQueryData(['messages', newTodo.conversationId], context.previousMessages);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries(['messages', variables.conversationId]);
            queryClient.invalidateQueries(['conversations', user?.id]);
            queryClient.invalidateQueries(['chat-unread-count', user?.id]);
        }
    });

    // Edit Message Mutation (Optimistic, 15-min window)
    const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const editMessageMutation = useMutation({
        mutationFn: async ({ messageId, conversationId, newContent }) => {
            const { data, error } = await supabase
                .from('messages')
                .update({ content: newContent, is_edited: true, edited_at: new Date().toISOString() })
                .eq('id', messageId)
                .eq('sender_id', user.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onMutate: async ({ messageId, conversationId, newContent }) => {
            await queryClient.cancelQueries(['messages', conversationId]);
            const previous = queryClient.getQueryData(['messages', conversationId]);
            queryClient.setQueryData(['messages', conversationId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map(page =>
                        page.map(m => m.id === messageId ? { ...m, content: newContent, is_edited: true } : m)
                    )
                };
            });
            return { previous, conversationId };
        },
        onError: (err, vars, context) => {
            toast.error('Failed to edit message');
            if (context?.previous) queryClient.setQueryData(['messages', context.conversationId], context.previous);
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries(['messages', variables.conversationId]);
        }
    });

    // Archive / Un-archive Conversation Mutation (Optimistic)
    const archiveConversationMutation = useMutation({
        mutationFn: async ({ conversationId, archive }) => {
            const response = await fetch('/api/conversations/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, archive })
            });
            if (!response.ok) throw new Error('Failed to archive conversation');
            return response.json();
        },
        onMutate: async ({ conversationId, archive }) => {
            await queryClient.cancelQueries(['conversations', user?.id]);
            const previous = queryClient.getQueryData(['conversations', user?.id]);

            // Optimistically update the archived_by field in the cache
            queryClient.setQueryData(['conversations', user?.id], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map(page =>
                        page.map(conv => {
                            if (conv.id !== conversationId) return conv;
                            const archivedBy = conv.archived_by || [];
                            const newArchivedBy = archive
                                ? archivedBy.includes(user.id) ? archivedBy : [...archivedBy, user.id]
                                : archivedBy.filter(id => id !== user.id);
                            return { ...conv, archived_by: newArchivedBy };
                        })
                    )
                };
            });

            return { previous };
        },
        onError: (err, vars, context) => {
            if (context?.previous) queryClient.setQueryData(['conversations', user?.id], context.previous);
            toast.error('Failed to archive conversation');
        },
        onSuccess: (data, variables) => {
            toast.success(variables.archive ? 'Chat archived' : 'Chat restored');
        },
        onSettled: () => {
            queryClient.invalidateQueries(['conversations', user?.id]);
        }
    });

    // Delete Conversation Mutation (Optimistic)
    const deleteConversationMutation = useMutation({
        mutationFn: async (conversationId) => {
            const response = await fetch('/api/conversations/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId })
            });
            if (!response.ok) throw new Error('Failed to delete conversation');
            return response.json();
        },
        onMutate: async (conversationId) => {
            await queryClient.cancelQueries(['conversations', user?.id]);
            const previous = queryClient.getQueryData(['conversations', user?.id]);

            queryClient.setQueryData(['conversations', user?.id], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map(page => page.filter(conv => conv.id !== conversationId))
                };
            });

            return { previous };
        },
        onError: (err, vars, context) => {
            if (context?.previous) queryClient.setQueryData(['conversations', user?.id], context.previous);
            toast.error('Failed to delete conversation');
        },
        onSuccess: () => {
            toast.success('Chat deleted');
        },
        onSettled: () => {
            queryClient.invalidateQueries(['conversations', user?.id]);
        }
    });

        // Start Conversation Mutation
    const startConversationMutation = useMutation({
        mutationFn: async ({ propertyId, hostId, content, attachmentType = null, attachmentData = null }) => {
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .eq('property_id', propertyId)
                .eq('tenant_id', user.id)
                .single();

            if (existing) {
                await sendMessageMutation.mutateAsync({ conversationId: existing.id, content, attachmentType, attachmentData });
                return existing.id;
            }

            const { data: newConv, error } = await supabase
                .from('conversations')
                .insert({
                    property_id: propertyId,
                    tenant_id: user.id,
                    host_id: hostId,
                    last_message: content || 'Shared an attachment'
                })
                .select()
                .single();
            
            if (error) throw error;
            
            await sendMessageMutation.mutateAsync({ conversationId: newConv.id, content, attachmentType, attachmentData });
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
            .channel(`chat-conversations:${user.id}`)
            .on('postgres_changes', { 
                event: '*', schema: 'public', table: 'conversations', 
                filter: `tenant_id=eq.${user.id}` 
            }, () => {
                queryClient.invalidateQueries(['conversations', user.id]);
                queryClient.invalidateQueries(['chat-unread-count', user.id]);
            })
            .on('postgres_changes', { 
                event: '*', schema: 'public', table: 'conversations', 
                filter: `host_id=eq.${user.id}` 
            }, () => {
                queryClient.invalidateQueries(['conversations', user.id]);
                queryClient.invalidateQueries(['chat-unread-count', user.id]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient, supabase]);

    // Subscribe to messages only for the active conversation.
    // Avoids a global "all messages" subscription that would not scale.
    useEffect(() => {
        if (!user || !activeConversation) return;

        const channel = supabase
            .channel(`chat-messages:${activeConversation}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConversation}`
            }, (payload) => {
                const msg = payload.new;

                queryClient.setQueryData(['messages', activeConversation], (old) => {
                    if (!old) return old;
                    const pages = [...old.pages];
                    if (pages.length === 0) pages.push([]);
                    const firstPage = pages[0] || [];
                    if (firstPage.some(m => m.id === msg.id)) return old;
                    pages[0] = [msg, ...firstPage];
                    return { ...old, pages };
                });

                if (msg.sender_id !== user.id) {
                    markReadMutation.mutate(activeConversation);
                }

                queryClient.invalidateQueries(['conversations', user.id]);
                queryClient.invalidateQueries(['chat-unread-count', user.id]);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConversation}`
            }, (payload) => {
                const msg = payload.new;

                queryClient.setQueryData(['messages', activeConversation], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map(page =>
                            page.map(m => m.id === msg.id ? { ...m, ...msg } : m)
                        )
                    };
                });

                queryClient.invalidateQueries(['conversations', user.id]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, activeConversation, queryClient, supabase, markReadMutation]);

    // Stored in cache as newest → older (DESC pages). Present to UI as oldest → newest.
    const conversationMessages = messagesQuery.data 
        ? messagesQuery.data.pages.flat().slice().reverse()
        : [];
    
    const conversationsList = conversationsQuery.data
        ? conversationsQuery.data.pages.flat().map(conv => ({
            ...conv,
            unread_count: conv.tenant_id === user?.id ? conv.unread_count_tenant : conv.unread_count_host
        }))
        : [];

    // Normalize archived_by: Supabase may return null instead of [] if column is NULL
    const activeConversations = conversationsList.filter(c => !(c.archived_by ?? []).includes(user?.id));
    const archivedConversations = conversationsList.filter(c => (c.archived_by ?? []).includes(user?.id));

    const value = {
        conversations: activeConversations,
        archivedConversations,
        allConversations: conversationsList, // full list, used by ChatWindow to look up archived convs
        messages: conversationMessages,
        loading: conversationsQuery.isLoading && conversationsList.length === 0,
        refreshConversations: conversationsQuery.refetch,
        fetchConversationById,
        
        fetchNextConversations: conversationsQuery.fetchNextPage,
        hasNextConversations: conversationsQuery.hasNextPage,
        isFetchingNextConversations: conversationsQuery.isFetchingNextPage,

        isLoadingMessages: messagesQuery.isLoading,
        isFetchingNextPage: messagesQuery.isFetchingNextPage,
        hasNextPage: messagesQuery.hasNextPage,
        fetchNextPage: messagesQuery.fetchNextPage,
        
        activeConversation,
        setActiveConversation,
        
        sendMessage: (conversationId, content, attachmentType, attachmentData) => sendMessageMutation.mutateAsync({ conversationId, content, attachmentType, attachmentData }),
        startConversation: (pid, hid, content, attachmentType, attachmentData) => startConversationMutation.mutateAsync({ propertyId: pid, hostId: hid, content, attachmentType, attachmentData }),
        editMessage: (messageId, conversationId, newContent) => editMessageMutation.mutateAsync({ messageId, conversationId, newContent }),
        archiveConversation: (conversationId, archive) => archiveConversationMutation.mutateAsync({ conversationId, archive }),
        deleteConversation: (conversationId) => deleteConversationMutation.mutateAsync(conversationId),

        EDIT_WINDOW_MS,
        unreadCount: unreadCountQuery.data || 0
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
