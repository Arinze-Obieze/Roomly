'use client';

import { MdArrowBack, MdShare, MdFavorite, MdFavoriteBorder } from 'react-icons/md';

export default function PropertyHeader({ title, onBack, onShare, onToggleSave, isSaved }) {
  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-4">
      <button 
        onClick={onBack}
        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
      >
        <MdArrowBack className="text-xl text-slate-700" />
      </button>
      <h1 className="font-semibold text-navy-950 truncate flex-1">{title}</h1>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onShare}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-700 transition-colors"
          title="Share"
        >
          <MdShare className="text-xl" />
        </button>
        <button 
          onClick={onToggleSave}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-700 transition-colors"
          title={isSaved ? "Remove from favorites" : "Save to favorites"}
        >
          {isSaved ? <MdFavorite className="text-xl text-red-500" /> : <MdFavoriteBorder className="text-xl" />}
        </button>
      </div>
    </div>
  );
}
