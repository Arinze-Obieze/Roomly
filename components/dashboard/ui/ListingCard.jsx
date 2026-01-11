"use client";

import { MdLocationOn, MdVerified, MdOutlineBed } from "react-icons/md";
import { FaWifi, FaPaw, FaShower, FaTree } from "react-icons/fa";

// Helper to get icon component by name
const getIconComponent = (iconName) => {
  const iconMap = {
    FaWifi, FaPaw, FaShower, FaTree,
    MdOutlineBed
  };
  return iconMap[iconName] || FaWifi;
};

export const ListingCard = ({ data, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect?.()}
      className="group bg-white rounded-2xl lg:rounded-3xl border border-slate-200 overflow-hidden active:scale-[0.98] transition-all duration-200 cursor-pointer lg:hover:shadow-xl lg:hover:-translate-y-1"
    >
      <div className="relative h-48 lg:h-56 overflow-hidden">
        <img 
          src={data.image} 
          alt={data.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-900 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-xs">
          <div className={`w-1.5 h-1.5 rounded-full ${data.matchScore > 90 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="font-bold">{data.matchScore}% Match</span>
        </div>

        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-xl">
          <span className="font-bold text-sm lg:text-base">{data.price}</span>
          <span className="text-xs opacity-80">/{data.period}</span>
        </div>
      </div>

      <div className="p-4 lg:p-5">
        <div className="mb-2">
          <h3 className="font-bold text-base lg:text-lg text-slate-900 mb-1 line-clamp-1">{data.title}</h3>
          <div className="flex items-center gap-1 text-slate-500 text-sm">
            <MdLocationOn className="text-cyan-500 shrink-0" />
            <span className="truncate">{data.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 my-3">
          {data.amenities.slice(0, 2).map((am, i) => {
            const IconComponent = getIconComponent(am.icon);
            return (
              <div key={i} className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium border border-slate-100">
                <IconComponent size={12} /> {am.label}
              </div>
            );
          })}
          {data.amenities.length > 2 && (
            <div className="bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium border border-slate-100">
              +{data.amenities.length - 2}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 my-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={data.host.avatar} className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-slate-100" alt={data.host.name} />
            <span className="text-sm font-medium text-slate-700 truncate">{data.host.name}</span>
            {data.verified && <MdVerified className="text-cyan-500 shrink-0" size={18} title="Verified ID" />}
          </div>
          <button className="text-sm font-semibold text-slate-900 hover:text-cyan-600 transition-colors hidden lg:block">
            Details &rarr;
          </button>
          <button className="text-sm font-semibold text-cyan-600 lg:hidden">
            View
          </button>
        </div>
      </div>
    </div>
  );
};