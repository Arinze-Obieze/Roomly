'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/core/contexts/AuthContext';
import ReceivedInterestsTab from './ReceivedInterestsTab';
import SentInterestsTab from './SentInterestsTab';
import GlobalSpinner from '@/components/ui/GlobalSpinner';

export default function InterestsManager() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('received');
  const [data, setData] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/interests');
      if (!res.ok) throw new Error('Failed to fetch interests');
      const json = await res.json();
      setData(json);
      
      // If they have no received requests but have sent requests, default to sent tab.
      if (json.received.length === 0 && json.sent.length > 0) {
        setActiveTab('sent');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInterests();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-8 text-center text-navy-500">
        Please log in to view your interests.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl">
      {/* Tabs Header */}
      <div className="flex border-b border-navy-100 bg-white px-2">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-4 px-4 text-center font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'received' 
            ? 'border-terracotta-500 text-terracotta-600' 
            : 'border-transparent text-navy-500 hover:text-navy-700 hover:bg-navy-50'
          }`}
        >
          Received Requests 
          {data.received?.length > 0 && activeTab !== 'received' && (
            <span className="ml-2 inline-flex items-center justify-center bg-terracotta-100 text-terracotta-700 text-xs rounded-full h-5 w-5">
              {data.received.filter(r => r.status === 'pending').length || data.received.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-4 px-4 text-center font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'sent' 
            ? 'border-terracotta-500 text-terracotta-600' 
            : 'border-transparent text-navy-500 hover:text-navy-700 hover:bg-navy-50'
          }`}
        >
          Sent Requests
          {data.sent?.length > 0 && activeTab !== 'sent' && (
             <span className="ml-2 inline-flex items-center justify-center bg-navy-100 text-navy-700 text-xs rounded-full h-5 px-2">
               {data.sent.length}
             </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-navy-50/30">
        {loading ? (
          <div className="flex justify-center items-center h-48">
             <GlobalSpinner size="md" color="primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8 border border-red-100 bg-red-50 rounded-xl">
            {error}
            <button onClick={fetchInterests} className="block mt-4 mx-auto text-sm underline hover:text-red-700">Retry</button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {activeTab === 'received' && (
              <ReceivedInterestsTab 
                interests={data.received} 
                onUpdate={fetchInterests} 
              />
            )}
            {activeTab === 'sent' && (
              <SentInterestsTab 
                interests={data.sent} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
