'use client';

import { useState, useEffect } from 'react';
import { MdClose, MdChevronLeft, MdChevronRight, MdZoomIn, MdZoomOut } from 'react-icons/md';

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  // Sync internal state when prop changes
  useEffect(() => {
    if (isOpen) {
        setCurrentIndex(initialIndex);
        setScale(1);
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, scale]); // Re-bind if index changes to keep it fresh

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setScale(1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setScale(1);
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      
      {/* Controls */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
        aria-label="Close"
      >
        <MdClose size={32} />
      </button>

      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 hidden md:block"
            aria-label="Previous image"
          >
            <MdChevronLeft size={40} />
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 hidden md:block"
            aria-label="Next image"
          >
            <MdChevronRight size={40} />
          </button>
        </>
      )}

      {/* Main Image Container */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {currentImage.type === 'video' ? (
             <video 
                src={currentImage.url} 
                controls 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                autoPlay
             />
        ) : (
            <img
                src={currentImage.url}
                alt={`Gallery image ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
                style={{ transform: `scale(${scale})` }}
                onClick={() => setScale(s => s === 1 ? 1.5 : 1)} // Simple toggle zoom
            />
        )}
      </div>

      {/* Footer / Thumbs */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full max-w-4xl px-4 z-50">
         <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium">
            {currentIndex + 1} / {images.length}
         </div>
         
         {/* Thumbnails Strip (Desktop only for cleaner look) */}
         <div className="hidden md:flex gap-2 overflow-x-auto max-w-full p-2 rounded-xl bg-black/20 backdrop-blur-sm">
            {images.map((img, idx) => (
                <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 transition-all border-2 ${
                        currentIndex === idx ? 'border-terracotta-500 opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                >
                    {img.type === 'video' ? (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] text-white">Video</div>
                    ) : (
                        <img src={img.url} className="w-full h-full object-cover" alt="thumb" />
                    )}
                </button>
            ))}
         </div>

         <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="md:hidden inline-flex items-center justify-center gap-2 bg-white text-navy-950 px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
         >
            <MdClose size={18} />
            Close
         </button>
      </div>

    </div>
  );
}
