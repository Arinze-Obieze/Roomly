"use client";

import { 
  MdLocationOn, 
  MdOutlineAttachMoney, 
  MdVerified, 
  MdMap,
  MdKeyboardArrowDown
} from "react-icons/md";
import { FaWifi, FaPaw, FaCar, FaShower, FaTree } from "react-icons/fa";
import { FilterSection } from "./FilterSection";
import { useFilters } from "@/components/dashboard/filters/useFilters";
import { COUNTIES, DUBLIN_AREAS } from "@/data/locations";
import { AMENITIES } from "@/data/amenities";

export const FilterContent = ({ variant }) => {
  const { filters, updateFilters } = useFilters();
  const isSidebar = variant === 'sidebar';

  const handleCountyChange = (e) => {
    const county = e.target.value;
    updateFilters({ 
      location: county, 
      area: '' // Reset area when county changes
    });
  };

  return (
    <div className={`${isSidebar ? 'p-4' : 'p-6'}`}>
      {isSidebar && (
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">Current Search</h3>
            <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
              {filters.location || 'All Ireland'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MdLocationOn className="text-cyan-500" size={16} />
              <span>{filters.location || 'Ireland'} • {filters.bedrooms.length > 0 ? `${filters.bedrooms.join(', ')} bed` : 'Any bed'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MdOutlineAttachMoney className="text-cyan-500" size={16} />
              <span>{filters.priceRange === 'all' ? 'All prices' : filters.priceRange}</span>
            </div>
          </div>
        </div>
      )}

      {/* Location Filter */}
      <FilterSection title="Location" isSidebar={isSidebar} defaultOpen={true}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">County</label>
            <div className="relative">
              <select
                value={filters.location || ''}
                onChange={handleCountyChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 appearance-none cursor-pointer"
              >
                <option value="">All Ireland</option>
                {COUNTIES.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
              <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>

          {filters.location === 'Dublin' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Area (Dublin)</label>
              <div className="relative">
                <select
                  value={filters.area || ''}
                  onChange={(e) => updateFilters({ area: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 appearance-none cursor-pointer"
                >
                  <option value="">All Dublin</option>
                  {DUBLIN_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Price (Monthly)" isSidebar={isSidebar} defaultOpen={isSidebar}>
        <div className="grid grid-cols-2 gap-2">
          {['All', 'Budget', 'Mid', 'Premium'].map((range) => (
            <button
              key={range}
              className={`py-2.5 text-sm font-medium rounded-lg transition-colors border ${
                filters.priceRange === range.toLowerCase()
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => updateFilters({ priceRange: range.toLowerCase() })}
            >
              {range}
            </button>
          ))}
        </div>
        {/* Helper text for ranges */}
        <div className="mt-2 text-xs text-slate-400 text-center">
          {filters.priceRange === 'budget' && 'Under €800'}
          {filters.priceRange === 'mid' && '€800 - €1,500'}
          {filters.priceRange === 'premium' && 'Over €1,500'}
        </div>
      </FilterSection>

      <FilterSection title="Bedrooms" isSidebar={isSidebar}>
        <div className="grid grid-cols-3 gap-2">
          {['Studio', '1', '2', '3+', 'Any'].map((bed) => (
            <button
              key={bed}
              className={`py-2.5 rounded-lg font-medium transition-colors text-sm border ${
                (bed === 'Studio' && filters.propertyType === 'studio') ||
                (bed === '1' && filters.bedrooms.includes(1)) ||
                (bed === '2' && filters.bedrooms.includes(2)) ||
                (bed === 'Any' && filters.bedrooms.length === 0)
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
          {AMENITIES.slice(0, 5).map((amenity) => (
            <label key={amenity.value} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <amenity.icon className="text-slate-400" size={16} />
                <span className="text-sm font-medium text-slate-700">{amenity.label}</span>
              </div>
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity.value)}
                onChange={(e) => {
                  const amenityKey = amenity.value;
                  const newAmenities = e.target.checked
                    ? [...filters.amenities, amenityKey]
                    : filters.amenities.filter(a => a !== amenityKey);
                  updateFilters({ amenities: newAmenities });
                }}
                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
            </label>
          ))}
        </div>
      </FilterSection>

      <div className={`${isSidebar ? 'mt-6' : 'mt-4'}`}>
        <label className="flex items-center justify-between p-3 border border-slate-100 bg-white rounded-xl shadow-sm cursor-pointer hover:border-cyan-200 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
              <MdVerified size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Verified Only</p>
              <p className="text-xs text-slate-500">Trusted listings</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => updateFilters({ verifiedOnly: e.target.checked })}
            className="w-5 h-5 rounded-md border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
        </label>
      </div>

      {isSidebar && (
        <div className="mt-6 space-y-2">
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]">
            <MdMap size={18} />
            Map View
          </button>
        </div>
      )}
    </div>
  );
};