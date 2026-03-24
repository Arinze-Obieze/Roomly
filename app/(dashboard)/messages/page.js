'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChat } from '@/core/contexts/ChatContext';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdSend, MdArrowBack } from 'react-icons/md';

function MessagesPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState('received');
    const [showArchived, setShowArchived] = useState(false);
    const { activeConversation, setActiveConversation, allConversations, refreshConversations, fetchConversationById } = useChat();
    const initializedConversationRef = useRef(null);

    useEffect(() => {
        const conversationId = searchParams.get('conversationId');
        if (!conversationId) return;
        if (initializedConversationRef.current === conversationId) return;

        if (activeConversation !== conversationId) {
            setActiveConversation(conversationId);
        }

        const matchedConversation = (allConversations ?? []).find((conversation) => conversation.id === conversationId);
        if (matchedConversation) {
            initializedConversationRef.current = conversationId;
            setShowArchived(false);
            setActiveTab(matchedConversation.host_id === user?.id ? 'received' : 'sent');
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const fetchedConversation = await fetchConversationById?.(conversationId);
                if (cancelled || !fetchedConversation) {
                    refreshConversations?.();
                    return;
                }

                initializedConversationRef.current = conversationId;
                setShowArchived(false);
                setActiveTab(fetchedConversation.host_id === user?.id ? 'received' : 'sent');
            } catch {
                if (!cancelled) {
                    refreshConversations?.();
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams, activeConversation, setActiveConversation, allConversations, user?.id, refreshConversations, fetchConversationById]);

    // When switching tabs, always exit archive view and clear active conversation
    const handleTabChange = (tab) => {
        initializedConversationRef.current = null;
        setActiveTab(tab);
        setShowArchived(false);
        setActiveConversation(null);
        if (searchParams.get('conversationId')) {
            router.replace('/messages', { scroll: false });
        }
    };

    return (
        <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-[100dvh] lg:h-[calc(100dvh-5.5rem)] flex flex-col bg-white overflow-hidden"
        >
            {/* Mobile-only top bar for navigating out of Messages */}
            <div className="lg:hidden flex items-center gap-2 px-3 py-2 border-b border-navy-200 bg-white">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-1 text-navy-500 hover:bg-navy-50 rounded-full transition-colors"
                    aria-label="Back"
                >
                    <MdArrowBack size={22} />
                </button>
                <h1 className="text-sm font-heading font-bold text-navy-950">Messages</h1>
            </div>

            <div className="flex-1 flex min-h-0">
                {/* Sidebar - Fixed width, full height */}
                <motion.div 
                    layout
                    className={`w-full md:w-96 shrink-0 h-full border-r border-navy-200 bg-white flex flex-col ${
                        activeConversation ? 'hidden md:flex' : 'flex'
                    }`}
                >
                    <ChatList activeTab={activeTab} onTabChange={handleTabChange} showArchived={showArchived} setShowArchived={setShowArchived} />
                </motion.div>

                {/* Chat Window - Takes remaining space */}
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeConversation ? 'chat' : 'empty'}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className={`flex-1 h-full flex flex-col min-h-0 ${
                            activeConversation ? 'flex' : 'hidden md:flex'
                        }`}
                    >
                        {activeConversation ? (
                            <ChatWindow />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-navy-50 min-h-0">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-navy-200 shadow-sm">
                                    <MdSend className="text-terracotta-500" size={32} />
                                </div>
                                <h3 className="font-heading font-bold text-navy-950 mb-1">Your messages</h3>
                                <p className="text-sm font-sans text-navy-500">Select a conversation to start messaging</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.main>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={null}>
            <MessagesPageContent />
        </Suspense>
    );
}
