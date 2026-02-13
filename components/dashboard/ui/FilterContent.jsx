"use client";

import { 
  MdLocationOn, 
  MdOutlineAttachMoney, 
  MdVerified, 
  MdMap,
  MdKeyboardArrowDown,
  MdSearch,
  MdFilterList
} from "react-icons/md";
import { FilterSection } from "./FilterSection";
import { useFilters } from "@/components/dashboard/filters/useFilters";
import { COUNTIES, DUBLIN_AREAS } from "@/data/locations";
import { AMENITIES } from "@/data/amenities";
import { DEAL_BREAKERS, LIFESTYLE_PRIORITIES, PROPERTY_CATEGORIES, OFFERING_TYPES } from "@/data/listingOptions";

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

  const handleKeywordChange = (e) => {
      console.log("Keyword search:", e.target.value);
  };

  return (
    <div className={`${isSidebar ? 'p-4' : 'p-6 space-y-8'}`}>
      
      {/* Sidebar Header / Summary */}
      {isSidebar && (
        <div className="mb-6 p-3 bg-navy-50 rounded-xl border border-navy-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-navy-900">Current Search</h3>
            <span className="text-xs bg-terracotta-50 text-terracotta-700 px-2 py-1 rounded-full">
              {filters.location || 'All Ireland'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-navy-500">
              <MdLocationOn className="text-terracotta-500" size={16} />
              <span>{filters.location || 'Ireland'} • {filters.bedrooms.length > 0 ? `${filters.bedrooms.join(', ')} bed` : 'Any bed'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-navy-500">
              <MdOutlineAttachMoney className="text-terracotta-500" size={16} />
              <span>{filters.priceRange === 'all' ? 'All prices' : filters.priceRange}</span>
            </div>
          </div>
        </div>
      )}

      {/* Keywords Search */}
      {!isSidebar && (
        <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
            <input 
                type="text" 
                placeholder="Search by keyword (e.g. 'gym', 'balcony', 'ensuite')" 
                className="w-full pl-10 pr-4 py-3 bg-navy-50 border border-navy-100 rounded-xl focus:ring-2 focus:ring-terracotta-100 focus:border-terracotta-500 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                onChange={handleKeywordChange}
            />
        </div>
      )}

      {/* Location Filter */}
      <FilterSection title="Location" isSidebar={isSidebar} defaultOpen={true}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase mb-1 block">County</label>
            <div className="relative">
              <select
                value={filters.location || ''}
                onChange={handleCountyChange}
                className="w-full p-2.5 bg-white border border-navy-200 rounded-xl text-sm font-medium text-navy-700 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 appearance-none cursor-pointer"
              >
                <option value="">All Ireland</option>
                {COUNTIES.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
              <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" size={20} />
            </div>
          </div>

          {filters.location === 'Dublin' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-semibold text-navy-500 uppercase mb-1 block">Area (Dublin)</label>
              <div className="relative">
                <select
                  value={filters.area || ''}
                  onChange={(e) => updateFilters({ area: e.target.value })}
                  className="w-full p-2.5 bg-white border border-navy-200 rounded-xl text-sm font-medium text-navy-700 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 appearance-none cursor-pointer"
                >
                  <option value="">All Dublin</option>
                  {DUBLIN_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" size={20} />
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
                  ? 'bg-navy-900 text-white border-navy-900' 
                  : 'bg-white text-navy-600 border-navy-200 hover:border-navy-300 hover:bg-navy-50'
              }`}
              onClick={() => updateFilters({ priceRange: range.toLowerCase() })}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-navy-400 text-center">
          {filters.priceRange === 'budget' && 'Under €800'}
          {filters.priceRange === 'mid' && '€800 - €1,500'}
          {filters.priceRange === 'premium' && 'Over €1,500'}
        </div>
      </FilterSection>

      <FilterSection title="Property Type" isSidebar={isSidebar}>
         <div className="grid grid-cols-2 gap-2">
            {PROPERTY_CATEGORIES.map(type => (
                 <button
                    key={type.value}
                    onClick={() => updateFilters({ propertyType: filters.propertyType === type.value ? 'any' : type.value })}
                    className={`py-2 px-3 rounded-lg text-sm border font-medium text-left transition-all ${
                        filters.propertyType === type.value 
                        ? 'bg-terracotta-50 border-terracotta-200 text-terracotta-700' 
                        : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50'
                    }`}
                >
                    {type.label}
                </button>
            ))}
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
                  ? 'bg-navy-900 text-white border-navy-900' 
                  : 'bg-white text-navy-600 border-navy-200 hover:border-navy-300 hover:bg-navy-50'
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

      <FilterSection title="House Vibe & Rules" isSidebar={isSidebar}>
        <div className="space-y-4">
            <div>
                <label className="text-xs font-semibold text-navy-500 uppercase mb-2 block">Lifestyle</label>
                <div className="flex flex-wrap gap-2">
                    {LIFESTYLE_PRIORITIES.map(item => (
                        <button
                            key={item.id}
                            className="px-3 py-1.5 rounded-full border border-navy-200 text-xs font-medium text-navy-600 hover:bg-navy-50"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="text-xs font-semibold text-navy-500 uppercase mb-2 block">Must Allow / Welcome</label>
                <div className="space-y-2">
                    {DEAL_BREAKERS.map(db => (
                         <label key={db.id} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" className="peer w-4 h-4 border-2 border-navy-200 rounded text-terracotta-600 focus:ring-terracotta-500 focus:ring-offset-0" />
                            </div>
                            <span className="text-sm text-navy-600 group-hover:text-navy-900 transition-colors">{db.label}</span>
                         </label>
                    ))}
                </div>
            </div>
        </div>
      </FilterSection>

      <FilterSection title="Amenities" isSidebar={isSidebar}>
        <div className="space-y-2">
          {AMENITIES.map((amenity) => (
            <label key={amenity.value} className="flex items-center justify-between p-2.5 hover:bg-navy-50 rounded-lg cursor-pointer border border-transparent hover:border-navy-100 transition-colors">
              <div className="flex items-center gap-3">
                <amenity.icon className="text-navy-400" size={16} />
                <span className="text-sm font-medium text-navy-700">{amenity.label}</span>
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
                className="w-4 h-4 rounded border-navy-300 text-terracotta-600 focus:ring-terracotta-500"
              />
            </label>
          ))}
        </div>
      </FilterSection>

      {isSidebar && (
        <div className="mt-6 space-y-2">
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-navy-200 text-navy-700 rounded-xl font-bold hover:bg-navy-50 hover:border-navy-300 transition-all active:scale-[0.98]">
            <MdMap size={18} />
            Map View
          </button>
        </div>
      )}
    </div>
  );
};