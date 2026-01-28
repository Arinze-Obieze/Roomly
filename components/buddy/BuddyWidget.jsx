
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import BuddyInviteCard from '@/components/dashboard/widgets/BuddyInviteCard';
import CreateGroupModal from './CreateGroupModal';
import { MdGroup, MdChatBubble, MdAdd } from 'react-icons/md';
import { useRouter } from 'next/navigation';

export default function BuddyWidget(props) {
  const { user } = useAuthContext();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchGroup();
    }
  }, [user]);

  const fetchGroup = async () => {
    try {
      // Find active group membership
      const { data: member } = await supabase
        .from('buddy_group_members')
        .select(`
            group:buddy_groups (
                id, 
                name,
                admin_id
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (member?.group) {
        setGroup(member.group);
      }
    } catch (error) {
      console.error('Error fetching buddy group:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null; // Or skeleton

  if (!group) {
    return (
        <>
            <BuddyInviteCard 
                onCreateGroup={() => setIsCreateOpen(true)}
                onJoinGroup={() => router.push('/dashboard/buddy/join')} 
                {...props}
            />
            <CreateGroupModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onCreated={(newGroup) => setGroup(newGroup)}
            />
        </>
    );
  }

  // Active Group Summary Widget
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 p-6 shadow-sm ${props.compact ? '' : 'mb-8'}`}>
        <div className="flex justify-between items-center mb-4">
            <div>
                <span className="text-cyan-500 font-bold text-xs uppercase tracking-wider">Your Buddy Group</span>
                <h2 className="text-xl font-bold text-slate-900">{group.name}</h2>
            </div>
            <button 
                onClick={() => router.push(`/dashboard/buddy`)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 p-2 rounded-full transition-colors"
            >
                <MdGroup size={24} />
            </button>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={() => router.push(`/dashboard/buddy`)}
                className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-[0.98]"
            >
                <MdChatBubble size={18} />
                Open Group Chat
            </button>
            <button 
                onClick={() => router.push(`/dashboard/buddy?tab=invite`)} 
                className="bg-cyan-50 text-cyan-600 font-bold px-4 rounded-xl hover:bg-cyan-100 transition-colors"
                title="Invite Member"
            >
                <MdAdd size={20} />
            </button>
        </div>
    </div>
  );
}
