
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from '@/core/contexts/AuthContext';
import BuddyDashboard from '@/components/buddy/BuddyDashboard';
import BuddyInviteCard from '@/components/dashboard/widgets/BuddyInviteCard';
import CreateGroupModal from '@/components/buddy/CreateGroupModal';
import { useRouter } from 'next/navigation';

export default function BuddyPage() {
  const { user } = useAuthContext();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchGroup();
    }
  }, [user]);

  const fetchGroup = async () => {
    try {
      const { data: member } = await supabase
        .from('buddy_group_members')
        .select(`
            group:buddy_groups (
                id, 
                name,
                admin_id,
                created_at,
                preferences
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (member?.group) {
        setGroup(member.group);
      }
      // If no group, we just stay on this page to show the invite card
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching buddy group:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (newGroup) => {
    setGroup(newGroup);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!group) {
    return (
        <div className="max-w-xl mx-auto mt-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6 px-4">Buddy-Up</h1>
            <div className="px-4">
                <BuddyInviteCard 
                    onCreateGroup={() => setIsCreateOpen(true)}
                    onJoinGroup={() => router.push('/dashboard/buddy/join')} 
                />
            </div>
            <CreateGroupModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onCreated={handleCreated}
            />
        </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <BuddyDashboard group={group} />
    </div>
  );
}
