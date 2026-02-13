'use client';

import { useState } from 'react';
import { MdGridView, MdPlayCircle } from 'react-icons/md';
import ImageLightbox from '@/components/ui/ImageLightbox';

export default function PropertyGallery({ media, title }) {
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!media || media.length === 0) return null;

  const openLightbox = (index) => {
    setActiveImage(index);
    setIsLightboxOpen(true);
  };

  // Mobile Swipeable Carousel (visible on small screens)
  const renderMobileGallery = () => (
    <div className="md:hidden aspect-[4/3] relative bg-slate-100 overflow-hidden">
        {media[activeImage].type === 'video' ? (
             <video src={media[activeImage].url} controls className="w-full h-full object-cover" />
        ) : (
             <img 
               src={media[activeImage].url} 
               alt={title} 
               className="w-full h-full object-cover"
               onClick={() => openLightbox(activeImage)}
             />
        )}
        
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
            {activeImage + 1} / {media.length}
        </div>

        {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {media.map((_, idx) => (
                    <div 
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${activeImage === idx ? 'bg-white scale-125' : 'bg-white/50'}`}
                    />
                ))}
            </div>
        )}
        
        {/* Invisible hit areas for swipe simulation (simple previous/next click zones) */}
        <div className="absolute inset-y-0 left-0 w-1/4 z-10" onClick={() => setActiveImage(prev => (prev - 1 + media.length) % media.length)} />
        <div className="absolute inset-y-0 right-0 w-1/4 z-10" onClick={() => setActiveImage(prev => (prev + 1) % media.length)} />
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
