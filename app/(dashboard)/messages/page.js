'use client';

import { useState } from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChat } from '@/core/contexts/ChatContext';

export default function MessagesPage() {
    // Basic state for the page - actual chat state is in Context
    const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
    const { activeConversation } = useChat();

    return (
        <main className="h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] flex bg-white overflow-hidden">
            {/* Sidebar - Hidden on mobile if active conversation exists */}
            <div className={`w-full md:w-96 shrink-0 h-full border-r border-slate-200 ${activeConversation ? 'hidden md:block' : 'block'}`}>
                <ChatList activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Chat Window - Visible on mobile ONLY if active conversation exists */}
            <div className={`flex-1 h-full relative ${activeConversation ? 'block' : 'hidden md:block'}`}>
                <ChatWindow />
                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                     style={{ 
                         backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
                     }} 
                />
            </div>
        </main>
    );
}
