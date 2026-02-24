import { MdHome, MdInfoOutline } from 'react-icons/md';
import SelectionCard from '../SelectionCard';
import { PROPERTY_CATEGORIES, OFFERING_TYPES } from '@/data/listingOptions';

export default function PropertyForm({ formData, handleChange }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Property Category */}
      <div>
        <label className="block text-sm font-heading font-bold text-navy-950 mb-2">
          Property Category
          <span className="ml-2 text-xs font-sans font-medium text-terracotta-600">(Required)</span>
        </label>
        <select
          value={formData.property_category || ''}
          onChange={(e) => handleChange('property_category', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-white focus:ring-2 focus:ring-terracotta-500 outline-none font-sans"
        >
          {PROPERTY_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Offering Type */}
      <div>
        <label className="block text-sm font-heading font-bold text-navy-950 mb-3">
          What are you offering?
          <span className="ml-2 text-xs font-sans font-medium text-terracotta-600">(Required)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OFFERING_TYPES.map(type => (
            <SelectionCard
              key={type.value}
              selected={formData.offering_type === type.value}
              onClick={() => handleChange('offering_type', type.value)}
            >
              <type.icon size={24} className={`mx-auto mb-2 ${formData.offering_type === type.value ? 'text-teal-600' : 'text-navy-400'}`} />
              <div className="font-heading font-bold text-center mb-1">{type.label}</div>
              <div className="text-xs text-center font-sans text-navy-500">{type.description}</div>
            </SelectionCard>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">
            Bedrooms (total)
            <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.bedrooms}
            onChange={(e) => handleChange('bedrooms', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 outline-none font-sans"
          />
        </div>
        <div>
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">
            Bathrooms
            <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.bathrooms}
            onChange={(e) => handleChange('bathrooms', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 outline-none font-sans"
          />
        </div>
        <div>
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">
            Floor Area (sqm)
            <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.floor_area}
            onChange={(e) => handleChange('floor_area', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 outline-none font-sans"
          />
          <span className="text-xs text-navy-400 mt-1 block">Optional - helps with search</span>
        </div>
        <div>
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">
            Year Built
            <span className="ml-2 text-xs font-sans text-navy-500 font-medium">(Optional)</span>
          </label>
          <input
            type="number"
            min="1800"
            max={new Date().getFullYear()}
            value={formData.year_built}
            onChange={(e) => handleChange('year_built', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 outline-none font-sans"
          />
          <span className="text-xs text-navy-400 mt-1 block">Optional - helps seekers understand property age</span>
        </div>
      </div>

      {/* BER Rating */}
      <div>
        <label className="flex items-center gap-1 text-sm font-heading font-bold text-navy-950 mb-2">
          BER/EPC Rating
          <span className="ml-1 text-xs font-sans font-medium text-navy-500">(Optional)</span>
          <MdInfoOutline className="text-navy-400" />
        </label>
        <select
          value={formData.ber_rating || ''}
          onChange={(e) => handleChange('ber_rating', e.target.value)}
          className="w-full sm:w-1/2 px-4 py-3 rounded-xl border border-navy-200 bg-white focus:ring-2 focus:ring-terracotta-500 outline-none font-sans"
        >
          <option value="">Select Rating</option>
          {['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'E1', 'E2', 'F', 'G', 'Exempt'].map(rating => (
            <option key={rating} value={rating}>{rating}</option>
          ))}
        </select>
      </div>

    </div>
  );
}
