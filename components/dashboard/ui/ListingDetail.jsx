"use client";

import { 
  MdLocationOn, 
  MdVerified, 
  MdArrowBack,
  MdMoreVert 
} from "react-icons/md";
import { FaWifi, FaPaw, FaShower, FaTree } from "react-icons/fa";

// Helper to get icon component by name
const getIconComponent = (iconName) => {
  const iconMap = {
    FaWifi, FaPaw, FaShower, FaTree,
    MdOutlineBed: () => <MdLocationOn /> // Placeholder
  };
  return iconMap[iconName] || FaWifi;
};

export const ListingDetail = ({ data }) => {
  return (
    <div className="p-4">
      <div className="relative h-64 rounded-2xl overflow-hidden mb-4">
        <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl">
            <span className="font-bold">{data.price}</span>
            <span className="text-sm opacity-80">/{data.period}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-slate-600 mb-4">
          <MdLocationOn className="text-cyan-500" />
          <span>{data.location}</span>
        </div>

        <div className="bg-linear-to-r from-cyan-50 to-indigo-50 p-4 rounded-xl mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-bold">Excellent Match: {data.matchScore}%</span>
          </div>
          <p className="text-sm text-slate-600">Based on your lifestyle preferences and sleep schedule</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3">Amenities</h3>
        <div className="grid grid-cols-2 gap-3">
          {data.amenities.map((am, i) => {
            const IconComponent = getIconComponent(am.icon);
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <IconComponent className="text-cyan-500" size={20} />
                <span className="font-medium">{am.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3">About the Host</h3>
        <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
          <img src={data.host.avatar} className="w-12 h-12 rounded-full" alt={data.host.name} />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold">{data.host.name}</span>
              {data.verified && (
                <span className="flex items-center gap-1 text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
                  <MdVerified size={12} /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">Usually responds within 1 hour</p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white pt-4 border-t border-slate-200">
        <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl mb-3">
          Message Host
        </button>
        <button className="w-full py-4 bg-cyan-600 text-white font-bold rounded-xl">
          Save Property
        </button>
      </div>
    </div>
  );
};