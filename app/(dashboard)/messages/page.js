'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChat } from '@/core/contexts/ChatContext';
import { MdSend } from 'react-icons/md';

export default function MessagesPage() {
    const [activeTab, setActiveTab] = useState('received');
    const { activeConversation } = useChat();

    return (
        <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-screen flex flex-col bg-white overflow-hidden"
        >
            <div className="flex-1 flex min-h-0">
                {/* Sidebar - Fixed width, full height */}
                <motion.div 
                    layout
                    className={`w-full md:w-96 shrink-0 h-full border-r border-navy-200 bg-white flex flex-col ${
                        activeConversation ? 'hidden md:flex' : 'flex'
                    }`}
                >
                    <ChatList activeTab={activeTab} onTabChange={setActiveTab} />
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