
import { MdOutlineBed, MdBathtub, MdSquareFoot, MdCalendarToday } from 'react-icons/md';
import SelectionCard from '../SelectionCard';
import { PROPERTY_CATEGORIES, OFFERING_TYPES } from '@/data/listingOptions';

export default function PropertyForm({ formData, handleChange }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Property Category */}
      <div>
        <label className="block text-sm font-semibold text-navy-950 mb-2">
          Property Category
        </label>
        <select
          value={formData.property_category || ''}
          onChange={(e) => handleChange('property_category', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-terracotta-500 focus:border-cyan-500 outline-none appearance-none cursor-pointer"
        >
          <option value="">Select property type</option>
          {PROPERTY_CATEGORIES.map(cat => (
             <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Offering Type */}
      <div>
        <label className="block text-sm font-semibold text-navy-950 mb-3">
          What are you offering?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {OFFERING_TYPES.map(type => (
            <SelectionCard
              key={type.value}
              selected={formData.offering_type === type.value}
              onClick={() => handleChange('offering_type', type.value)}
              className="flex flex-col items-center text-center gap-2"
            >
              <div className={`p-3 rounded-full ${formData.offering_type === type.value ? 'bg-terracotta-100 text-terracotta-700' : 'bg-slate-100 text-slate-500'}`}>
                <type.icon size={24} />
              </div>
              <div>
                <div className="font-bold text-navy-950">{type.label}</div>
                <div className="text-xs text-slate-500 mt-1 leading-snug">{type.description}</div>
              </div>
            </SelectionCard>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Bedrooms</label>
          <div className="relative">
            <MdOutlineBed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="number" 
              value={formData.bedrooms}
              onChange={(e) => handleChange('bedrooms', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-terracotta-500 outline-none" 
              placeholder="e.g. 3"
            />
          </div>
        </div>
        <div>
           <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Bathrooms</label>
           <div className="relative">
            <MdBathtub className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="number" 
              value={formData.bathrooms}
              onChange={(e) => handleChange('bathrooms', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-terracotta-500 outline-none" 
              placeholder="e.g. 2"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Floor Area</label>
          <div className="relative">
            <MdSquareFoot className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="number"
              value={formData.floor_area}
              onChange={(e) => handleChange('floor_area', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-terracotta-500 outline-none" 
              placeholder="Sqm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Year Built</label>
          <div className="relative">
             <MdCalendarToday className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="number" 
              value={formData.year_built}
              onChange={(e) => handleChange('year_built', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-terracotta-500 outline-none" 
              placeholder="e.g. 2010"
            />
          </div>
        </div>
      </div>

       {/* BER Rating */}
       <div>
        <label className="block text-sm font-semibold text-navy-950 mb-2">
          BER / EPC Rating
        </label>
        <select
          value={formData.ber_rating || ''}
          onChange={(e) => handleChange('ber_rating', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-terracotta-500 focus:border-cyan-500 outline-none appearance-none cursor-pointer"
        >
          <option value="">Select BER rating</option>
          {['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'E1', 'E2', 'F', 'G', 'Exempt'].map(rating => (
             <option key={rating} value={rating}>{rating}</option>
          ))}
        </select>
      </div>

    </div>
  );
}
