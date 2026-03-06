
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from '@/core/contexts/AuthContext';
import BuddyDashboard from '@/components/buddy/BuddyDashboard';
import BuddyInviteCard from '@/components/dashboard/widgets/BuddyInviteCard';
import CreateGroupModal from '@/components/buddy/CreateGroupModal';
import BuddyGroupList from '@/components/buddy/BuddyGroupList';
import { useRouter } from 'next/navigation';
import GlobalSpinner from '@/components/ui/GlobalSpinner';

export default function BuddyPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchGroups();
    }
  }, [user, authLoading, router]);

  const fetchGroups = async () => {
    try {
      const { data: memberships } = await supabase
        .from('buddy_group_members')
        .select(`
            group_id,
            group:buddy_groups (
                id, 
                name,
                admin_id,
                created_at,
                preferences
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (memberships) {
        // Fetch member count for each group
        const groupsWithCounts = await Promise.all(memberships.map(async (m) => {
          const { count } = await supabase
            .from('buddy_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', m.group_id)
            .eq('status', 'active');
          
          return {
            ...m.group,
            member_count: count || 0
          };
        }));
        
        setGroups(groupsWithCounts);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching buddy groups:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (newGroup) => {
    setGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <GlobalSpinner size="md" color="slate" />
        </div>
    );
  }

  const activeGroup = groups.find(g => g.id === activeGroupId);

  if (activeGroup) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
        <BuddyDashboard 
          group={activeGroup} 
          onBack={() => setActiveGroupId(null)} 
          onAction={fetchGroups}
        />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
        <div className="max-w-xl mx-auto mt-8">
            <h1 className="text-2xl font-heading font-bold text-navy-950 mb-6 px-4">Buddy-Up</h1>
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

  return (
    <div className="min-h-screen bg-slate-50">
      <BuddyGroupList 
        groups={groups} 
        onSelect={(id) => setActiveGroupId(id)} 
        onCreateNew={() => setIsCreateOpen(true)}
      />
      <CreateGroupModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreated={handleCreated}
      />
    </div>
  );
}
