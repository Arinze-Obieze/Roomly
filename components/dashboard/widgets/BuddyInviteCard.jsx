
import { MdGroupAdd, MdMailOutline } from 'react-icons/md';

export default function BuddyInviteCard({ onCreateGroup, onJoinGroup, compact = false }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm ${compact ? 'p-5 mb-0' : 'p-6 mb-8'}`}>
      <div className={`text-center ${compact ? 'mb-4' : 'mb-6'}`}>
        <div className={`bg-cyan-50 rounded-full flex items-center justify-center mx-auto ${compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'} border border-cyan-100`}>
          <MdGroupAdd className={`text-cyan-600 ${compact ? 'text-xl' : 'text-3xl'}`} />
        </div>
        <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-slate-900 mb-1`}>Buddy-Up With Friends</h2>
        <p className="text-slate-500 text-sm">Team up with 1-3 friends to search for rooms together</p>
      </div>

      {!compact && (
        <div className="mb-8">
            <h3 className="font-bold text-sm text-slate-900 mb-4">How It Works</h3>
            <div className="space-y-3">
                {[
                    "Create a group (2-4 people)",
                    "Invite friends to join",
                    "Browse rooms together",
                    "Coordinate viewings via group chat"
                ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                            {i + 1}
                        </span>
                        <span className="text-sm text-slate-600 font-medium">{step}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className={`flex ${compact ? 'flex-col gap-2' : 'flex-col sm:flex-row gap-3'}`}>
        <button 
            onClick={onCreateGroup}
            className={`flex-1 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-[0.98] ${compact ? 'py-2.5 text-sm' : 'py-3'}`}
        >
            <MdGroupAdd size={compact ? 18 : 20} />
            Create {compact ? 'Group' : 'Buddy-Up Group'}
        </button>
        <button 
            onClick={onJoinGroup}
            className={`flex-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors active:scale-[0.98] ${compact ? 'py-2.5 text-sm' : 'py-3'}`}
        >
            {compact ? 'Have Invite? Join' : 'Have an invite? Join Group'}
        </button>
      </div>
    </div>
  );
}
