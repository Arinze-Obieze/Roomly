import SelectionCard from '../SelectionCard';
import { OCCUPATION_PREFERENCES, GENDER_PREFERENCES, LIFESTYLE_PRIORITIES, DEAL_BREAKERS } from '@/data/listingOptions';

export default function PreferencesForm({ formData, handleChange }) {

  const updateLifestylePriority = (id, priority) => {
    const current = { ...(formData.lifestyle_priorities || {}) };
    current[id] = priority;
    handleChange('lifestyle_priorities', current);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Occupation */}
      <div>
        <label className="block text-sm font-heading font-bold text-navy-950 mb-3">
          Ideally, who are you looking for?
          <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
            {OCCUPATION_PREFERENCES.map(pref => (
                 <SelectionCard
                    key={pref.value}
                    selected={formData.occupation_preference === pref.value}
                    onClick={() => handleChange('occupation_preference', pref.value)}
                    className="flex flex-col items-center gap-2 text-center"
                >
                    <pref.icon className={formData.occupation_preference === pref.value ? 'text-terracotta-600' : 'text-navy-400'} size={24} />
                    <span className={`text-sm font-heading font-bold ${
                      formData.occupation_preference === pref.value ? 'text-terracotta-900' : 'text-navy-700'
                    }`}>{pref.label}</span>
                 </SelectionCard>
            ))}
        </div>
      </div>

      {/* Age & Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
            <label className="block text-sm font-heading font-bold text-navy-950 mb-3">
              Gender Preference
              <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
            </label>
            <div className="flex bg-navy-100 p-1 rounded-xl">
                 {GENDER_PREFERENCES.map(g => (
                     <button
                        key={g.value}
                        type="button"
                        onClick={() => handleChange('gender_preference', g.value)}
                        className={`flex-1 py-2 text-sm font-heading font-medium rounded-lg transition-all ${
                            formData.gender_preference === g.value
                            ? 'bg-white text-navy-950 shadow-sm'
                            : 'text-navy-500 hover:text-navy-700'
                        }`}
                     >
                        {g.label}
                     </button>
                 ))}
            </div>
         </div>
         <div>
             <label className="block text-sm font-heading font-bold text-navy-950 mb-3">
              Age Range
              <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
             </label>
             <div className="bg-white border border-navy-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-navy-500 text-sm font-sans">Min: 18</span>
                <span className="font-heading font-bold text-navy-950">
                    {(formData.age_min || 18)} - {(formData.age_max || 99)}+
                </span>
                <span className="text-navy-500 text-sm font-sans">Max: 99</span>
             </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                 <input 
                    type="number" 
                    placeholder="Min"
                    value={formData.age_min || ''}
                    onChange={(e) => handleChange('age_min', e.target.value)}
                    className="px-3 py-2 border border-navy-200 rounded-lg text-sm font-sans focus:ring-2 focus:ring-terracotta-500 outline-none placeholder-navy-400"
                 />
                 <input 
                    type="number" 
                    placeholder="Max"
                    value={formData.age_max || ''}
                    onChange={(e) => handleChange('age_max', e.target.value)}
                    className="px-3 py-2 border border-navy-200 rounded-lg text-sm font-sans focus:ring-2 focus:ring-terracotta-500 outline-none placeholder-navy-400"
                 />
              </div>
         </div>
      </div>

      {/* Deal Breakers */}
      <div>
         <label className="block text-sm font-heading font-bold text-navy-950 mb-3">
          Deal-breakers
          <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
         </label>
         <p className="text-sm text-navy-500 mb-3 font-sans">Select any absolute no-go factors</p>
         <div className="flex flex-wrap gap-3">
            {DEAL_BREAKERS.map(breaker => {
                const isSelected = (formData.deal_breakers || []).includes(breaker.id);
                return (
                    <button
                        key={breaker.id}
                        type="button"
                        onClick={() => {
                            const current = formData.deal_breakers || [];
                            const updated = current.includes(breaker.id)
                                ? current.filter(id => id !== breaker.id)
                                : [...current, breaker.id];
                            handleChange('deal_breakers', updated);
                        }}
                        className={`px-4 py-2 rounded-xl border transition-all text-sm font-heading font-medium ${
                            isSelected
                            ? 'bg-terracotta-50 border-terracotta-200 text-terracotta-700'
                            : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300'
                        }`}
                    >
                        {breaker.label}
                    </button>
                );
            })}
         </div>
      </div>

      {/* Lifestyle Priorities */}
      <div>
         <label className="block text-sm font-heading font-bold text-navy-950 mb-4">
          Lifestyle Matching
          <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
         </label>
         <div className="space-y-4">
            {LIFESTYLE_PRIORITIES.map(factor => (
                <div key={factor.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-navy-100 last:border-0">
                    <span className="font-heading font-medium text-navy-700">{factor.label}</span>
                    <div className="flex gap-2">
                        {['must_match', 'nice_to_have', 'not_important'].map(opt => {
                             const current = (formData.lifestyle_priorities || {})[factor.id] || 'not_important';
                             const isSelected = current === opt;
                             return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => updateLifestylePriority(factor.id, opt)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium border transition-all ${
                                        isSelected 
                                        ? opt === 'must_match' ? 'bg-terracotta-50 border-terracotta-200 text-terracotta-700' 
                                          : opt === 'nice_to_have' ? 'bg-teal-50 border-teal-200 text-teal-700'
                                          : 'bg-navy-100 border-navy-200 text-navy-600'
                                        : 'bg-white border-navy-200 text-navy-400 hover:border-navy-300'
                                    }`}
                                >
                                    {opt === 'must_match' ? 'Must Match' : opt === 'nice_to_have' ? 'Nice to have' : 'Not important'}
                                </button>
                             );
                        })}
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* Flatmate Description */}
      <div>
        <label className="block text-sm font-heading font-bold text-navy-950 mb-2">
          Ideal Flatmate Description
          <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
        </label>
        <textarea
            value={formData.partner_description || ''}
            onChange={(e) => handleChange('partner_description', e.target.value)}
            placeholder="Describe the perfect person for this room..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none resize-none font-sans placeholder-navy-400"
        />
      </div>

    </div>
  );
}
