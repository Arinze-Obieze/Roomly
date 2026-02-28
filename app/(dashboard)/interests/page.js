'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { 
  MdFavorite, 
  MdPerson, 
  MdCheckCircle, 
  MdCancel, 
  MdAccessTime,
  MdLock,
  MdLocationOn
} from 'react-icons/md';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function InterestsPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('seeker'); // 'seeker' or 'landlord'
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState([]);

  const fetchInterests = async (type) => {
    setLoading(true);
    try {
      const endpoint = type === 'landlord' ? '/api/landlord/interests' : '/api/seeker/interests';
      const response = await fetch(endpoint);
      const data = await response.json();
      setInterests(data.data || []);
    } catch (error) {
      console.error('Error fetching interests:', error);
      toast.error('Failed to load interests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInterests(activeTab);
    }
  }, [user, activeTab]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/interests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Interest ${status === 'accepted' ? 'accepted' : 'declined'}`);
        fetchInterests(activeTab);
      } else {
        toast.error(data.error || 'Failed to update interest');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  if (!user) return null;

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-navy-950 mb-2">Room Interests</h1>
        <p className="text-navy-500">Manage interactions and unlock mutual private details.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-navy-100 p-1.5 rounded-2xl mb-8 w-fit">
        <button
          onClick={() => setActiveTab('seeker')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-heading font-bold transition-all ${
            activeTab === 'seeker' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-500 hover:text-navy-700'
          }`}
        >
          <MdFavorite /> I'm Interested In
        </button>
        <button
          onClick={() => setActiveTab('landlord')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-heading font-bold transition-all ${
            activeTab === 'landlord' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-500 hover:text-navy-700'
          }`}
        >
          <MdPerson /> Interested in My Rooms
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-navy-100" />
            ))}
        </div>
      ) : interests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-navy-200">
           <div className="bg-navy-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdAccessTime className="text-navy-300 text-4xl" />
           </div>
           <h3 className="text-xl font-heading font-bold text-navy-950">No interests found</h3>
           <p className="text-navy-500 mt-2">
             {activeTab === 'seeker'
               ? "You haven't shown interest in any rooms yet."
               : "No one has shown interest in your rooms yet."}
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interests.map((item) => (
             <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-navy-100 shadow-sm hover:shadow-md hover:shadow-navy-950/5 transition-shadow">
               {activeTab === 'seeker' ? (
                 /* SEEKER CARD: Interest in a property */
                 <div onClick={() => router.push(`/rooms/${item.property.id}`)} className="cursor-pointer">
                    <div className="relative h-40">
                        {item.property.property_media?.[0]?.url ? (
                            <img
                                src={item.property.property_media[0].url}
                                className={`w-full h-full object-cover ${item.shouldMask ? 'blur-xl grayscale scale-110' : ''}`}
                                alt={item.property.title}
                            />
                        ) : (
                            <div className="w-full h-full bg-navy-100 flex items-center justify-center">
                                <MdFavorite className="text-navy-200 text-4xl" />
                            </div>
                        )}
                        <div className="absolute top-3 right-3">
                             <StatusBadge status={item.status} />
                        </div>
                    </div>
                    <div className="p-5">
                        <h4 className="font-bold text-navy-900 line-clamp-1 mb-1">{item.property.title}</h4>
                        <div className="flex items-center gap-1 text-navy-500 text-xs mb-3">
                            <MdLocationOn className="text-terracotta-400" />
                            {item.property.city}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full bg-navy-100 overflow-hidden ${item.shouldMask ? 'blur-[2px]' : ''}`}>
                                    {item.property.users?.profile_picture && (
                                        <img src={item.property.users.profile_picture} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <span className="text-xs font-heading font-bold text-navy-700">{item.property.users?.full_name}</span>
                            </div>
                            <span className="text-xs text-navy-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                 </div>
               ) : (
                 /* LANDLORD CARD: Seeker interest in my property */
                 <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full bg-terracotta-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ${item.shouldMask ? 'blur-[3px]' : ''}`}>
                                {item.seeker.profile_picture ? (
                                    <img src={item.seeker.profile_picture} className="w-full h-full object-cover" />
                                ) : (
                                    <MdPerson className="text-terracotta-500 text-2xl" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-heading font-bold text-navy-950 flex items-center gap-1">
                                    {item.seeker.full_name}
                                    {item.shouldMask && <MdLock className="text-navy-300 text-xs" />}
                                </h4>
                                <span className="text-xs text-navy-500">Seeker</span>
                            </div>
                        </div>
                        <StatusBadge status={item.status} />
                    </div>

                    <div className="bg-navy-50 rounded-2xl p-3 mb-4 border border-navy-100">
                        <div className="text-[10px] text-navy-400 font-heading font-bold uppercase tracking-wider mb-1">Interested in</div>
                        <div className="text-sm font-heading font-bold text-navy-700 line-clamp-1">{item.property.title}</div>
                    </div>

                    {item.status === 'pending' ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleUpdateStatus(item.id, 'accepted')}
                                className="flex-1 bg-terracotta-500 text-white font-heading font-bold py-2 rounded-xl text-xs hover:bg-terracotta-600 transition-colors shadow-lg shadow-terracotta-500/10 active:scale-95"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                className="flex-1 bg-navy-100 text-navy-600 font-heading font-bold py-2 rounded-xl text-xs hover:bg-navy-200 transition-colors active:scale-95"
                            >
                                Decline
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push(`/messages`)}
                            className="w-full bg-navy-950 text-white font-heading font-bold py-2 rounded-xl text-xs hover:bg-navy-900 transition-colors active:scale-95"
                        >
                            Open Conversation
                        </button>
                    )}
                 </div>
               )}
             </div>
          ))}
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }) {
    const configs = {
        pending: { icon: MdAccessTime, label: 'Pending', className: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
        accepted: { icon: MdCheckCircle, label: 'Accepted', className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        rejected: { icon: MdCancel, label: 'Declined', className: 'bg-red-50 text-red-600 border-red-100' }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.className}`}>
            <Icon size={12} />
            {config.label}
        </div>
    );
}
