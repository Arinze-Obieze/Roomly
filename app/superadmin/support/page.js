'use client';

import { useState, useEffect } from 'react';
import { 
  MdChatBubbleOutline, 
  MdFilterList, 
  MdSearch,
  MdFlag,
  MdCheckCircle,
  MdHistory,
  MdPerson
} from 'react-icons/md';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import AdminTicketConversation from '@/components/superadmin/support/AdminTicketConversation';
import GlobalSpinner from '@/components/ui/GlobalSpinner';

dayjs.extend(relativeTime);

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/support');
      const data = await res.json();
      if (data.data) setTickets(data.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const StatusBadge = ({ status }) => {
    const styles = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-amber-100 text-amber-700',
      resolved: 'bg-emerald-100 text-emerald-700',
      closed: 'bg-slate-100 text-slate-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles[status] || styles.open}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const PriorityIcon = ({ priority }) => {
    const colors = {
      low: 'text-slate-400',
      medium: 'text-blue-500',
      high: 'text-amber-500',
      urgent: 'text-rose-500'
    };
    return <MdFlag className={colors[priority] || colors.medium} size={14} />;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <GlobalSpinner size="lg" color="primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-spaceGrotesk text-slate-900">Support Management</h1>
          <p className="text-slate-500 mt-1">Manage and resolve user support tickets</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={fetchTickets}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh"
            >
                <MdHistory size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-220px)]">
        {/* Left: Ticket List */}
        <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-slate-100 space-y-3">
             <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
             </div>
             <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap transition-all ${
                            filterStatus === s ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        {s.replace('_', ' ')}
                    </button>
                ))}
             </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
             {filteredTickets.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 text-sm">No tickets found</div>
             ) : (
                 filteredTickets.map(ticket => (
                     <button
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`w-full text-left p-4 hover:bg-slate-50 transition-all relative ${
                            selectedTicketId === ticket.id ? 'bg-slate-50 ring-1 ring-inset ring-primary' : ''
                        }`}
                     >
                        <div className="flex justify-between items-start mb-1">
                            <StatusBadge status={ticket.status} />
                            <PriorityIcon priority={ticket.priority} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">{ticket.subject}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <span className="truncate max-w-[100px]">{ticket.user?.full_name}</span>
                            <span>•</span>
                            <span>{dayjs(ticket.updated_at).fromNow()}</span>
                        </div>
                     </button>
                 ))
             )}
          </div>
        </div>

        {/* Right: Conversation & Info */}
        <div className="xl:col-span-3">
           {selectedTicket ? (
               <AdminTicketConversation 
                  ticket={selectedTicket} 
                  onUpdate={fetchTickets} 
               />
           ) : (
               <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center h-full text-center p-12">
                   <MdChatBubbleOutline className="text-slate-200 text-6xl mb-4" />
                   <h3 className="text-xl font-bold text-slate-900 mb-2">Select a ticket to manage</h3>
                   <p className="text-slate-500 max-w-sm">
                       Choose a support ticket from the list to view the conversation and take administrative actions.
                   </p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
}
