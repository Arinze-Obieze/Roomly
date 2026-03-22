'use client';

import { useState, useEffect, useCallback } from 'react';
import { MdGridView, MdPlayCircle, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import ImageLightbox from '@/components/ui/ImageLightbox';
import useEmblaCarousel from 'embla-carousel-react';

export default function PropertyGallery({ media, title }) {
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!media || media.length === 0) return null;

  const openLightbox = (index) => {
    setActiveImage(index);
    setIsLightboxOpen(true);
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Mobile Swipeable Carousel (visible on small screens)
  const renderMobileGallery = () => (
    <div className="md:hidden relative bg-slate-100 overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
            {media.map((item, idx) => (
                <div className="flex-[0_0_100%] min-w-0 relative aspect-[4/3] h-full" key={idx}>
                    {item.type === 'video' ? (
                         <video src={item.url} controls className="w-full h-full object-cover" />
                    ) : (
                         <img 
                           src={item.url} 
                           alt={title} 
                           className="w-full h-full object-cover cursor-pointer select-none"
                           onClick={() => openLightbox(idx)}
                         />
                    )}
                </div>
            ))}
        </div>
        
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none z-10">
            {selectedIndex + 1} / {media.length}
        </div>

        {media.length > 1 && (
            <>
                <button 
                    onClick={scrollPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/70 hover:bg-white backdrop-blur-md rounded-full shadow-md z-10 text-navy-900 active:scale-90 transition-all"
                >
                    <MdChevronLeft size={20} />
                </button>
                <button 
                    onClick={scrollNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/70 hover:bg-white backdrop-blur-md rounded-full shadow-md z-10 text-navy-900 active:scale-90 transition-all"
                >
                    <MdChevronRight size={20} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
                    {media.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${selectedIndex === idx ? 'bg-white scale-125 shadow-sm' : 'bg-white/60'}`}
                        />
                    ))}
                </div>
            </>
        )}
    </div>
  );

  // Desktop Bento Grid (visible on md+)
  const renderDesktopGallery = () => {
    const count = media.length;
    if (count === 0) return null;

    // Grid Configuration based on count
    let gridClass = "hidden md:grid gap-2 h-[450px] rounded-2xl overflow-hidden relative group ";
    let mainImageClass = "relative cursor-pointer hover:opacity-95 transition-opacity h-full w-full object-cover ";
    
    if (count === 1) {
        gridClass += "grid-cols-1";
        mainImageClass += ""; 
    } else if (count === 2) {
        gridClass += "grid-cols-2";
        mainImageClass += "";
    } else if (count === 3 || count === 4) {
        gridClass += "grid-cols-4 grid-rows-2";
        mainImageClass += "col-span-2 row-span-2";
    } else {
        gridClass += "grid-cols-4 grid-rows-2"; // Standard 1+4 layout
        mainImageClass += "col-span-2 row-span-2";
    }

    const renderMediaItem = (item, index, className = "") => (
        <div 
            key={index} 
            className={`relative cursor-pointer hover:opacity-95 transition-opacity overflow-hidden ${className}`}
            onClick={() => openLightbox(index)}
        >
            {item.type === 'video' ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <MdPlayCircle className="text-white opacity-80" size={index === 0 ? 64 : 32} />
                    <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                </div>
            ) : (
                <img src={item.url} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
            )}

            {/* Overlay for the last visible item if there are more */}
            {index === 4 && count > 5 && (
                <div className="absolute inset-0 bg-navy-950/60 flex items-center justify-center group-hover:bg-navy-950/50 transition-colors">
                    <span className="text-white font-bold text-lg flex items-center gap-2">
                        <MdGridView /> 
                        +{count - 5}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className={gridClass}>
            {/* Main Image (Always index 0) */}
            {renderMediaItem(media[0], 0, mainImageClass)}

            {/* Remaining Images Logic */}
            {count === 2 && renderMediaItem(media[1], 1)}
            
            {(count === 3 || count === 4) && (
                <div className="col-span-2 row-span-2 flex flex-col gap-2 h-full">
                    {media.slice(1, count).map((item, idx) => (
                        <div key={idx} className="flex-1 relative overflow-hidden">
                             {renderMediaItem(item, idx + 1, "h-full w-full absolute inset-0")}
                        </div>
                    ))}
                </div>
            )}

            {count >= 5 && media.slice(1, 5).map((item, idx) => renderMediaItem(item, idx + 1))}

            <button 
                onClick={() => openLightbox(0)}
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-navy-950 px-4 py-2 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm transition-all flex items-center gap-2 z-10"
            >
                <MdGridView /> Show all photos
            </button>
        </div>
    );
  };

  return (
    <>
        <div className="mb-6 md:mb-8">
            {renderMobileGallery()}
            {renderDesktopGallery()}
        </div>

        <ImageLightbox 
            images={media}
            initialIndex={activeImage}
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
        />
    </>
  );
}
