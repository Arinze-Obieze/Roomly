'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MdSave, MdFilterList, MdAttachMoney, MdEdit, MdCheck } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function MatchPreferencesForm({ user, onComplete, initialData }) {
  const [mode, setMode] = useState(initialData ? 'view' : 'edit');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age_min: 18,
    age_max: 50,
    gender_preference: 'any',
    accepted_smoking: [],
    accepted_pets: true,
    budget_min: 0,
    budget_max: 2000,
    stay_duration_min: 6,
    stay_duration_max: 12,
  });

  const supabase = createClient();

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      setMode('view');
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxGroup = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(i => i !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('match_preferences')
        .upsert({ user_id: user.id, ...formData });
      
      if (error) throw error;
      toast.success('Match preferences updated!');
      setMode('view'); // Switch to view mode
      if (onComplete) onComplete();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryCard = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fadeIn">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">
             <MdFilterList className="text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Roommate Preferences</h2>
            <p className="text-slate-500 text-sm">We use this to find your best matches.</p>
          </div>
        </div>
        <button 
          onClick={() => setMode('edit')}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <MdEdit /> Edit Preferences
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Budget */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Budget</h3>
           <div className="text-xl font-bold text-slate-900">
             €{formData.budget_min} - €{formData.budget_max}
           </div>
           <p className="text-slate-500 text-xs mt-1">per month</p>
        </div>

        {/* Card 2: Age & Gender */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Demographics</h3>
           <div className="space-y-1">
             <div className="text-base font-medium text-slate-900">
               {formData.age_min} - {formData.age_max} years old
             </div>
             <div className="text-slate-600 text-sm capitalize">
               {formData.gender_preference === 'any' ? 'Any Gender' : `${formData.gender_preference} Only`}
             </div>
           </div>
        </div>

        {/* Card 3: Dealbreakers */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filters</h3>
           <ul className="space-y-1.5 text-sm">
             <li className="flex items-center gap-2 text-slate-700">
               {formData.accepted_pets ? <MdCheck className="text-green-500" /> : <span className="text-red-400">✕</span>}
               <span>Pets: {formData.accepted_pets ? 'Accepted' : 'Not preferred'}</span>
             </li>
             <li className="flex items-center gap-2 text-slate-700">
                <span className="font-medium">Smoking:</span>
                <span className="text-slate-600">
                   {formData.accepted_smoking && formData.accepted_smoking.length > 0 
                     ? formData.accepted_smoking.join(', ') 
                     : 'None'}
                </span>
             </li>
           </ul>
        </div>
      </div>
    </div>
  );

  if (mode === 'view') {
    return renderSummaryCard();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">
          <MdFilterList className="text-xl" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ideal Roommate</h2>
          <p className="text-slate-500 text-sm">Who are you looking to live with?</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Age Range */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700">Age Range</label>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              value={formData.age_min}
              onChange={(e) => handleChange('age_min', parseInt(e.target.value))}
              className="w-20 p-2 border border-slate-200 rounded-lg text-center text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              min="18"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input 
              type="number" 
              value={formData.age_max}
              onChange={(e) => handleChange('age_max', parseInt(e.target.value))}
              className="w-20 p-2 border border-slate-200 rounded-lg text-center text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              max="100"
            />
            <span className="text-slate-600 font-medium ml-1 text-sm">years old</span>
          </div>
        </div>

        {/* Gender Preference */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700">Gender Preference</label>
          <div className="flex flex-wrap gap-2">
            {['any', 'male', 'female'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleChange('gender_preference', opt)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.gender_preference === opt
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {opt === 'any' ? 'No Preference' : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Smoking & Pets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-semibold mb-2 text-slate-700">Smoking</label>
               <p className="text-xs text-slate-500 mb-2">Select all that are okay with you</p>
               <div className="space-y-2">
                 {[
                   { val: 'no', label: 'Non-smoker' },
                   { val: 'outside', label: 'Outside smoker' },
                   { val: 'inside', label: 'Inside smoker' }
                 ].map((opt) => (
                   <label key={opt.val} className="flex items-center gap-2.5 p-2.5 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                     <input 
                       type="checkbox"
                       checked={(formData.accepted_smoking || []).includes(opt.val)}
                       onChange={() => handleCheckboxGroup('accepted_smoking', opt.val)}
                       className="rounded text-cyan-600 focus:ring-cyan-600 w-4 h-4"
                     />
                     <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                   </label>
                 ))}
               </div>
            </div>

            <div>
               <label className="block text-sm font-semibold mb-2 text-slate-700">Pets</label>
               <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.accepted_pets}
                      onChange={(e) => handleChange('accepted_pets', e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-600 h-4 w-4"
                    />
                    <span className="font-medium text-sm text-slate-900">I am comfortable living with pets</span>
                  </label>
               </div>
            </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Budget */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 flex items-center gap-2">
            <MdAttachMoney /> Budget (Monthly)
          </label>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-1">
               <div className="flex-1">
                 <label className="text-xs text-slate-500 mb-1 block">Min Price</label>
                 <div className="relative">
                   <span className="absolute left-3 top-2 text-slate-400 text-sm">€</span>
                   <input 
                     type="number"
                     value={formData.budget_min}
                     onChange={(e) => handleChange('budget_min', e.target.value)}
                     className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                   />
                 </div>
               </div>
               <div className="text-slate-300">-</div>
               <div className="flex-1">
                 <label className="text-xs text-slate-500 mb-1 block">Max Price</label>
                  <div className="relative">
                   <span className="absolute left-3 top-2 text-slate-400 text-sm">€</span>
                   <input 
                     type="number"
                     value={formData.budget_max}
                     onChange={(e) => handleChange('budget_max', e.target.value)}
                     className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                   />
                 </div>
               </div>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setMode('view')}
          className="mr-2 px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-colors disabled:opacity-70 shadow-lg text-sm"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
          {!loading && <MdSave />}
        </button>
      </div>
    </form>
  );
}
