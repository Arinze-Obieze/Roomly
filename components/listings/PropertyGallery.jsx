'use client';

import { useState } from 'react';
import { MdOutlineBed } from 'react-icons/md';

export default function PropertyGallery({ media, title }) {
  const [activeImage, setActiveImage] = useState(0);

  if (!media || media.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden bg-slate-200 mb-8 shadow-sm">
      <div className="aspect-video relative bg-black">
        {media[activeImage].type === 'video' ? (
          <video
            src={media[activeImage].url}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <img 
            src={media[activeImage].url} 
            alt={title}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        )}
        
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-full">
            {media.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeImage === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Thumbs for desktop */}
      {media.length > 1 && (
        <div className="hidden md:flex gap-2 p-2 overflow-x-auto bg-white">
          {media.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(idx)}
              className={`relative w-24 h-16 rounded-lg overflow-hidden shrink-0 transition-all border-2 ${
                activeImage === idx ? 'border-cyan-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <span className="text-white text-xs">Video</span>
                </div>
              ) : (
                <img src={item.url} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
