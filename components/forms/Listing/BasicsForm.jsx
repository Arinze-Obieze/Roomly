
import { MdPerson } from 'react-icons/md';
import SelectionCard from '../SelectionCard';
import { USER_ROLES, RENTAL_TYPES } from '@/data/listingOptions';

export default function BasicsForm({ formData, handleChange }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-navy-950 mb-2">
            Who is listing this property?
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdPerson className="text-slate-400" size={20} />
            </div>
            <select
              value={formData.role || ''}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">Select your role</option>
              {USER_ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
           <label className="block text-sm font-semibold text-navy-950 mb-3">
            Rental Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RENTAL_TYPES.map(type => (
              <SelectionCard
                key={type.value}
                selected={formData.rental_type === type.value}
                onClick={() => handleChange('rental_type', type.value)}
              >
                <div className="font-bold text-navy-950 mb-1">{type.label}</div>
                <div className="text-xs text-navy-500">{type.description}</div>
              </SelectionCard>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-950 mb-2">
            Listing Title
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Spacious room in Dublin 2 near LUAS"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none"
            />

          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-950 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe your property...&#10;• What's the vibe?&#10;• Who are the current flatmates?&#10;• What's nearby?"
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
}
