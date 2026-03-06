'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { 
  MdHelpOutline, 
  MdAdd, 
  MdChat, 
  MdAccessTime, 
  MdCheckCircle, 
  MdErrorOutline,
  MdChevronRight
} from 'react-icons/md';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import CreateTicketModal from '@/components/support/CreateTicketModal';
import TicketConversation from '@/components/support/TicketConversation';
import GlobalSpinner from '@/components/ui/GlobalSpinner';

dayjs.extend(relativeTime);

export default function SupportPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchTickets();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (data.data) setTickets(data.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const StatusBadge = ({ status }) => {
    const styles = {
      open: 'bg-blue-50 text-blue-600 border-blue-100',
      in_progress: 'bg-amber-50 text-amber-600 border-amber-100',
      resolved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      closed: 'bg-slate-50 text-slate-600 border-slate-100'
    };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.open}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-12">
      <GlobalSpinner size="lg" color="primary" />
    </div>
  );

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 flex items-center gap-2">
            <MdHelpOutline className="text-terracotta-500" />
            Support Center
          </h1>
          <p className="text-navy-500 text-sm mt-1">Submit inquiries and track your support tickets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-navy-950 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-navy-900 transition-all shadow-lg active:scale-95"
        >
          <MdAdd size={20} />
          New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tickets List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-heading font-bold text-navy-900 text-sm uppercase tracking-wider mb-4 px-1">Your Tickets</h3>
          
          {tickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-navy-100 shadow-sm">
              <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdChat className="text-navy-200 text-2xl" />
              </div>
              <p className="text-navy-500 text-sm">No tickets found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedTicketId === ticket.id 
                      ? 'bg-navy-50 border-navy-200 shadow-sm' 
                      : 'bg-white border-navy-100 hover:border-navy-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <StatusBadge status={ticket.status} />
                    <span className="text-[10px] font-medium text-navy-400">
                      {dayjs(ticket.updated_at).fromNow()}
                    </span>
                  </div>
                  <h4 className="font-bold text-navy-900 text-sm line-clamp-1 mb-1">{ticket.subject}</h4>
                  <div className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">{ticket.category}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation Area */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <TicketConversation ticket={selectedTicket} onUpdate={fetchTickets} />
          ) : (
            <div className="bg-white rounded-4xl border border-navy-100 p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mb-6">
                <MdChat className="text-navy-200 text-4xl" />
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-2">Select a ticket</h3>
              <p className="text-navy-500 max-w-xs mx-auto">
                Choose a ticket from the list to view the conversation or click "New Ticket" to start a new one.
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={(ticket) => {
          fetchTickets();
          setSelectedTicketId(ticket.id);
        }}
      />
    </div>
  );
}
