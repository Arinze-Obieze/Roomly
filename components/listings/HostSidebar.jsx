'use client';

import { motion } from 'framer-motion';

export default function HostSidebar({ 
  host, 
  isOwner, 
  contacting, 
  onContactHost, 
  onEditListing, 
  onViewProfile,
  contactButtonText,
  isPrivate
}) {
  const isOnline = host?.privacy_setting === 'public' && 
                   host?.last_seen && 
                   (new Date() - new Date(host.last_seen)) < 5 * 60 * 1000;

  const formatResponseTime = (ms) => {
    if (!ms || ms <= 0) return null;
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins === 0 ? '< 1' : mins} min${mins !== 1 ? 's' : ''}`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''}`;
    const days = Math.round(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Meet the Host</h3>
        
        <div 
          className="flex items-center gap-4 mb-6 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors -mx-2"
          onClick={onViewProfile}
        >
          <div className="relative">
            {host.avatar ? (
              <img 
                src={host.avatar} 
                className={`w-16 h-16 rounded-full object-cover bg-slate-100 ${isPrivate ? 'blur-sm grayscale' : ''}`} 
                alt={host.name}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-terracotta-100 text-terracotta-700 flex items-center justify-center text-xl font-bold">
                {host.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
            )}
            {isOnline && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                title="Online now"
                className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              </motion.div>
            )}
          </div>
            
            <div>
              <div className="font-bold text-navy-950 flex items-center gap-2">
                {isOwner ? 'You' : host.name}
              </div>
              <div className="text-sm text-slate-500">Joined 2024</div>
            </div>
        </div>

        {isOwner ? (
            <button 
              onClick={onEditListing}
              className="w-full bg-slate-100 text-slate-700 border border-slate-200 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-sm active:scale-[0.98]"
            >
              Edit Listing
            </button>
        ) : (
            <button 
              onClick={onContactHost}
              disabled={contacting}
              className="w-full bg-navy-950 text-white py-3 rounded-xl font-bold hover:bg-navy-900 transition-colors shadow-lg shadow-navy-950/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {contacting ? 'Loading...' : (contactButtonText || 'Contact Host')}
            </button>
        )}
        {host?.average_response_time_ms > 0 && (
          <p className="text-xs text-center text-slate-500 mt-4 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Usually responds in {formatResponseTime(host.average_response_time_ms)}
          </p>
        )}
      </div>
    </div>
  );
}
