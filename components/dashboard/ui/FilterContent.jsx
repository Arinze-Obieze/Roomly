"use client";

import { 
  MdLocationOn, 
  MdOutlineAttachMoney, 
  MdVerified, 
  MdMap 
} from "react-icons/md";
import { FaWifi, FaPaw, FaCar, FaShower } from "react-icons/fa";
import { FilterSection } from "./FilterSection";
import { useFilters } from "@/components/dashboard/filters/useFilters";

export const FilterContent = ({ variant }) => {
  const { filters, updateFilters } = useFilters();
  const isSidebar = variant === 'sidebar';

  return (
    <div className={`${isSidebar ? 'p-4' : 'p-6'}`}>
      {isSidebar && (
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">Current Search</h3>
            <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
              12 matches
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MdLocationOn className="text-cyan-500" size={16} />
              <span>Dublin • {filters.bedrooms.length} bed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MdOutlineAttachMoney className="text-cyan-500" size={16} />
              <span>All price ranges</span>
            </div>
          </div>
        </div>
      )}

      <FilterSection title="Price" isSidebar={isSidebar} defaultOpen={isSidebar}>
        <div className="grid grid-cols-2 gap-2">
          {['All', 'Budget', 'Mid', 'Premium'].map((range) => (
            <button
              key={range}
              className={`py-2.5 text-sm font-medium rounded-lg transition-colors ${
                filters.priceRange === range.toLowerCase()
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => updateFilters({ priceRange: range.toLowerCase() })}
            >
              {range}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Bedrooms" isSidebar={isSidebar}>
        <div className="grid grid-cols-3 gap-2">
          {['Studio', '1', '2', '3+', 'Any'].map((bed) => (
            <button
              key={bed}
              className={`py-2.5 rounded-lg font-medium transition-colors ${
                (bed === 'Studio' && filters.propertyType === 'studio') ||
                (bed === '1' && filters.bedrooms.includes(1)) ||
                (bed === '2' && filters.bedrooms.includes(2)) ||
                (bed === 'Any' && filters.bedrooms.length === 0)
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => {
                if (bed === 'Studio') {
                  updateFilters({ propertyType: filters.propertyType === 'studio' ? 'any' : 'studio' });
                } else if (bed === 'Any') {
                  updateFilters({ bedrooms: [] });
                } else if (bed === '3+') {
                  const newBedrooms = filters.bedrooms.includes(3)
                    ? filters.bedrooms.filter(b => b !== 3)
                    : [...filters.bedrooms, 3];
                  updateFilters({ bedrooms: newBedrooms });
                } else {
                  const num = parseInt(bed);
                  const newBedrooms = filters.bedrooms.includes(num)
                    ? filters.bedrooms.filter(b => b !== num)
                    : [...filters.bedrooms, num];
                  updateFilters({ bedrooms: newBedrooms });
                }
              }}
            >
              {bed}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Amenities" isSidebar={isSidebar}>
        <div className="space-y-2">
          {[
            { icon: FaWifi, label: 'Wifi' },
            { icon: FaPaw, label: 'Pets' },
            { icon: FaCar, label: 'Parking' },
            { icon: FaShower, label: 'Ensuite' },
          ].map((amenity) => (
            <label key={amenity.label} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
              <div className="flex items-center gap-3">
                <amenity.icon className="text-slate-400" size={18} />
                <span className="text-sm font-medium">{amenity.label}</span>
              </div>
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity.label.toLowerCase())}
                onChange={(e) => {
                  const amenityKey = amenity.label.toLowerCase();
                  const newAmenities = e.target.checked
                    ? [...filters.amenities, amenityKey]
                    : filters.amenities.filter(a => a !== amenityKey);
                  updateFilters({ amenities: newAmenities });
                }}
                className="w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
              />
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Move-in" isSidebar={isSidebar} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          {['Anytime', 'This Month', 'Next Month', 'Specific'].map((option) => (
            <button
              key={option}
              className={`py-2 text-sm rounded-lg ${
                filters.moveInDate === option.toLowerCase().replace(' ', '_')
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => updateFilters({ 
                moveInDate: option.toLowerCase().replace(' ', '_') 
              })}
            >
              {option}
            </button>
          ))}
        </div>
      </FilterSection>

      <div className={`${isSidebar ? 'mt-6' : 'mt-4'}`}>
        <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
          <div className="flex items-center gap-3">
            <MdVerified className="text-cyan-500" size={20} />
            <div>
              <p className="text-sm font-medium">Verified Only</p>
              <p className="text-xs text-slate-500">Trusted listings</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => updateFilters({ verifiedOnly: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
          />
        </label>
      </div>

      {isSidebar && (
        <div className="mt-6 space-y-2">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
            <MdMap size={18} />
            Map View
          </button>
        </div>
      )}
    </div>
  );
};