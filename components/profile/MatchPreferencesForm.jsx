'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MdSave, MdFilterList, MdAttachMoney } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function MatchPreferencesForm({ user }) {
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
    const fetchPrefs = async () => {
      try {
        const { data, error } = await supabase
          .from('match_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setFormData(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        // No prefs yet
      }
    };
    
    if (user?.id) fetchPrefs();
  }, [user]);

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
    } catch (error) {
      console.error(error);
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <MdFilterList className="text-2xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ideal Roommate</h2>
          <p className="text-slate-500">Who are you looking to live with?</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Age Range */}
        <div>
          <label className="block text-sm font-semibold mb-4 text-slate-700">Age Range</label>
          <div className="flex items-center gap-4">
            <input 
              type="number" 
              value={formData.age_min}
              onChange={(e) => handleChange('age_min', parseInt(e.target.value))}
              className="w-24 p-2 border border-slate-200 rounded-lg text-center"
              min="18"
            />
            <span className="text-slate-400">to</span>
            <input 
              type="number" 
              value={formData.age_max}
              onChange={(e) => handleChange('age_max', parseInt(e.target.value))}
              className="w-24 p-2 border border-slate-200 rounded-lg text-center"
              max="100"
            />
            <span className="text-slate-600 font-medium ml-2">years old</span>
          </div>
        </div>

        {/* Gender Preference */}
        <div>
          <label className="block text-sm font-semibold mb-4 text-slate-700">Gender Preference</label>
          <div className="flex flex-wrap gap-3">
            {['any', 'male', 'female'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleChange('gender_preference', opt)}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                  formData.gender_preference === opt
                    ? 'bg-indigo-600 text-white shadow-md'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
               <label className="block text-sm font-semibold mb-3 text-slate-700">Smoking</label>
               <p className="text-xs text-slate-500 mb-3">Select all that are okay with you</p>
               <div className="space-y-2">
                 {[
                   { val: 'no', label: 'Non-smoker' },
                   { val: 'outside', label: 'Outside smoker' },
                   { val: 'inside', label: 'Inside smoker' }
                 ].map((opt) => (
                   <label key={opt.val} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                     <input 
                       type="checkbox"
                       checked={(formData.accepted_smoking || []).includes(opt.val)}
                       onChange={() => handleCheckboxGroup('accepted_smoking', opt.val)}
                       className="rounded text-indigo-600 focus:ring-indigo-600"
                     />
                     <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                   </label>
                 ))}
               </div>
            </div>

            <div>
               <label className="block text-sm font-semibold mb-3 text-slate-700">Pets</label>
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.accepted_pets}
                      onChange={(e) => handleChange('accepted_pets', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-600 h-5 w-5"
                    />
                    <span className="font-medium text-slate-900">I am comfortable living with pets</span>
                  </label>
               </div>
            </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Budget */}
        <div>
          <label className="block text-sm font-semibold mb-4 text-slate-700 flex items-center gap-2">
            <MdAttachMoney /> Budget (Monthly)
          </label>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4 mb-2">
               <div className="flex-1">
                 <label className="text-xs text-slate-500 mb-1 block">Min Price</label>
                 <div className="relative">
                   <span className="absolute left-3 top-2 text-slate-400">€</span>
                   <input 
                     type="number"
                     value={formData.budget_min}
                     onChange={(e) => handleChange('budget_min', e.target.value)}
                     className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
                   />
                 </div>
               </div>
               <div className="text-slate-300">-</div>
               <div className="flex-1">
                 <label className="text-xs text-slate-500 mb-1 block">Max Price</label>
                  <div className="relative">
                   <span className="absolute left-3 top-2 text-slate-400">€</span>
                   <input 
                     type="number"
                     value={formData.budget_max}
                     onChange={(e) => handleChange('budget_max', e.target.value)}
                     className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
                   />
                 </div>
               </div>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-70 shadow-lg"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
          {!loading && <MdSave />}
        </button>
      </div>
    </form>
  );
}
