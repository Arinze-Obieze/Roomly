'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from '@/core/contexts/AuthContext';
import BuddyInviteCard from '@/components/dashboard/widgets/BuddyInviteCard';
import CreateGroupModal from './CreateGroupModal';
import { MdGroup, MdChat, MdAdd, MdPeople } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BuddyWidget(props) {
  const { user, loading: authLoading } = useAuthContext();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchGroups();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const fetchGroups = async () => {
    try {
      const { data: memberships } = await supabase
        .from('buddy_group_members')
        .select(`
            group:buddy_groups (
                id, 
                name,
                admin_id
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (memberships) {
        // Fetch member counts for each group
        const groupsWithCounts = await Promise.all(memberships.map(async (m) => {
          const { count } = await supabase
            .from('buddy_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', m.group.id)
            .eq('status', 'active');
          
          return {
            ...m.group,
            member_count: count || 0
          };
        }));
        setGroups(groupsWithCounts);
      }
    } catch (error) {
      console.error('Error fetching buddy groups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-navy-100 p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-navy-100 rounded-lg w-1/3 mb-4" />
        <div className="h-10 bg-navy-100 rounded-xl w-full" />
      </div>
    );
  }

  if (groups.length === 0) {
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
          onCreated={(newGroup) => setGroups([newGroup])}
        />
      </>
    );
  }

  // If one group, show the detailed view
  if (groups.length === 1) {
    const group = groups[0];
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-navy-100 p-5 shadow-sm"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="inline-block px-2 py-1 bg-terracotta-50 text-terracotta-600 text-[10px] font-heading font-bold rounded-full mb-2">
              Buddy Group
            </span>
            <h3 className="font-heading font-bold text-navy-950">{group.name}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-navy-500">
              <MdPeople size={14} className="text-navy-400" />
              <span>{group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <button 
            onClick={() => router.push(`/dashboard/buddy`)}
            className="p-2 hover:bg-navy-50 rounded-xl transition-colors"
          >
            <MdGroup size={20} className="text-navy-600" />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => router.push(`/dashboard/buddy`)}
            className="flex-1 bg-navy-950 text-white font-heading font-bold py-3 rounded-xl hover:bg-navy-900 transition-all shadow-lg shadow-navy-950/10 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
          >
            <MdChat size={18} />
            Chat
          </button>
          <button 
            onClick={() => router.push(`/dashboard/buddy?tab=invite`)} 
            className="bg-navy-50 text-navy-600 font-bold px-4 rounded-xl hover:bg-navy-100 transition-colors border border-navy-200 flex items-center justify-center"
            title="Invite Member"
          >
            <MdAdd size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  // If multiple groups, show a summary view
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-navy-100 p-5 shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="inline-block px-2 py-1 bg-navy-50 text-navy-600 text-[10px] font-heading font-bold rounded-full mb-2 uppercase tracking-wider">
            Multiple Groups
          </span>
          <h3 className="font-heading font-bold text-navy-950">Your Buddy-Ups</h3>
          <p className="text-xs text-navy-500 mt-1">You are in {groups.length} active groups</p>
        </div>
        <div className="p-2 bg-navy-50 rounded-full">
          <MdGroup size={20} className="text-navy-600" />
        </div>
      </div>

      <div className="mt-4">
        <button 
          onClick={() => router.push(`/dashboard/buddy`)}
          className="w-full bg-navy-950 text-white font-heading font-bold py-3 rounded-xl hover:bg-navy-900 transition-all shadow-lg shadow-navy-950/10 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
        >
          View All Groups
          <MdArrowForward size={18} />
        </button>
      </div>
    </motion.div>
  );
}