'use client';

import { useState, useEffect, useCallback } from 'react';
import { MdClose, MdChevronLeft, MdChevronRight, MdZoomIn, MdZoomOut } from 'react-icons/md';
import useEmblaCarousel from 'embla-carousel-react';

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: initialIndex });

  // Sync internal state when prop changes
  useEffect(() => {
    if (isOpen) {
        setCurrentIndex(initialIndex);
        setScale(1);
        if (emblaApi) emblaApi.scrollTo(initialIndex, true);
    }
  }, [isOpen, initialIndex, emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
    setScale(1); // reset zoom when swiping
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

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
    if (emblaApi) emblaApi.scrollNext();
  };

  const handlePrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-navy-950/95 backdrop-blur-sm animate-in fade-in duration-200"
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
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
            aria-label="Previous image"
          >
            <MdChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
            aria-label="Next image"
          >
            <MdChevronRight className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </>
      )}

      {/* Main Image Container */}
      <div
        className="relative w-full h-full flex items-center justify-center p-0 md:p-12 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        ref={emblaRef}
      >
        <div className="flex w-full h-full touch-pan-y items-center">
            {images.map((img, idx) => (
                <div key={idx} className="flex-[0_0_100%] min-w-0 w-full h-full flex items-center justify-center relative p-4 md:p-0">
                    {img.type === 'video' ? (
                         <video 
                            src={img.url} 
                            controls={currentIndex === idx}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            autoPlay={currentIndex === idx}
                         />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <img
                                src={img.url}
                                alt={`Gallery image ${idx + 1}`}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-200 select-none cursor-pointer"
                                style={{ transform: currentIndex === idx ? `scale(${scale})` : 'scale(1)' }}
                                onClick={() => { if (currentIndex === idx) setScale(s => s === 1 ? 1.5 : 1) }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
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
      </div>
    </div>
  );
}
