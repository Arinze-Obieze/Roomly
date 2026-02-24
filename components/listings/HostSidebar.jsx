'use client';

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
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Meet the Host</h3>
        
        <div 
          className="flex items-center gap-4 mb-6 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors -mx-2"
          onClick={onViewProfile}
        >
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
        <p className="text-xs text-center text-slate-400 mt-4">
          Response time: usually within an hour
        </p>
      </div>
    </div>
  );
}
