'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { MdSave, MdFilterList, MdAttachMoney, MdEdit, MdCheck, MdLocationOn, MdWork, MdCalendarToday, MdClose } from 'react-icons/md';
import { CITIES_TOWNS } from '@/data/locations';
import toast from 'react-hot-toast';

const MOVE_IN_OPTIONS = [
  { value: 'immediately', label: 'Immediately (< 1 week)' },
  { value: '1-month', label: 'Within 1 Month' },
  { value: '2-months', label: 'Within 2 Months' },
  { value: 'flexible', label: 'Flexible' },
];

const OCCUPATION_OPTIONS = ['Student', 'Professional', 'Unemployed', 'Retired'];

export default function MatchPreferencesForm({ user, onComplete, initialData, role = 'seeker' }) {
  const supabase = createClient();

  /* New State for Logic */
  const [userRole, setUserRole] = useState(role); // Default to seeker
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(initialData ? 'view' : 'edit');

  const [formData, setFormData] = useState({
    location_areas: [],
    move_in_window: 'flexible',
    budget_min: '',
    budget_max: '',
    occupation_preference: [],
    age_min: 18,
    age_max: 60,
    gender_preference: 'any',
    accepted_smoking: [],
    accepted_pets: false,
    cleanliness_tolerance: null,   // seeker: what cleanliness standard they need
    guests_tolerance: null,         // seeker: how often host brings guests is ok
    ...initialData
  });

  const STEPS = [
    { id: 'logistics', title: 'Start with the Basics' },
    { id: 'demographics', title: 'Who are they?' },
    { id: 'habits', title: userRole === 'seeker' ? 'Your Dealbreakers' : 'Lifestyle & Habits' }
  ];

  useEffect(() => {
    setUserRole(role || 'seeker');
  }, [role]);

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
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  /* Stepper Logic */
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async (e = null) => {
    if(e) e.preventDefault();
    setLoading(true);
    try {
      // ... (upsert logic same as before)
      const { error } = await supabase
        .from('match_preferences')
        .upsert({ user_id: user.id, ...formData });
      
      if (error) throw error;
      toast.success('Match preferences updated!');
      setMode('view'); 
      if (onComplete) onComplete();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  /* Render Step Content */
  const renderStepContent = () => {
     switch(currentStep) {
        case 0: // Logistics (Budget & Location)
          return (
            <div className="space-y-6 animate-fadeIn">
               {/* Show Location only if Seeker */}
               {userRole === 'seeker' && (
                 <div>
                    <div className="flex items-center gap-2 mb-4">
                       <MdLocationOn className="text-terracotta-600 text-xl" />
                       <h3 className="font-heading font-bold text-navy-900">Preferred Locations</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-navy-50 p-4 rounded-xl border border-navy-100">
                       {/* Location Multi-Select */}
                       <div>
                         <label className="block text-sm font-semibold mb-2 text-navy-700">Where do you want to live?</label>
                         <div className="relative">
                            <select 
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val && !(formData.location_areas || []).includes(val)) {
                                  handleCheckboxGroup('location_areas', val);
                                }
                                e.target.value = ''; // Reset
                              }}
                              className="w-full p-2.5 rounded-xl border border-navy-200 bg-white text-sm focus:border-terracotta-500 focus:outline-none"
                            >
                              <option value="">Add a city/town...</option>
                              {CITIES_TOWNS.map(city => (
                                <option key={city} value={city} disabled={(formData.location_areas || []).includes(city)}>
                                  {city}
                                </option>
                              ))}
                            </select>
                         </div>
                         <div className="flex flex-wrap gap-2 mt-3">
                           {(formData.location_areas || []).map(loc => (
                             <span key={loc} className="inline-flex items-center gap-1 px-3 py-1 bg-terracotta-50 text-terracotta-700 rounded-full text-sm font-medium border border-terracotta-100">
                               {loc}
                               <button onClick={() => handleCheckboxGroup('location_areas', loc)} className="hover:text-terracotta-900">
                                 <MdClose />
                               </button>
                             </span>
                           ))}
                         </div>
                       </div>

                       {/* Move In Window */}
                       <div>
                         <label className="block text-sm font-semibold mb-2 text-navy-700">When do you want to move?</label>
                         <div className="space-y-2">
                            {MOVE_IN_OPTIONS.map((opt) => (
                              <label key={opt.value} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                 formData.move_in_window === opt.value 
                                   ? 'border-terracotta-500 bg-terracotta-50 ring-1 ring-terracotta-500' 
                                   : 'border-navy-200 hover:border-navy-300'
                              }`}>
                                 <input 
                                    type="radio" 
                                    name="move_in"
                                    value={opt.value}
                                    checked={formData.move_in_window === opt.value}
                                    onChange={(e) => handleChange('move_in_window', e.target.value)}
                                    className="text-terracotta-600 focus:ring-terracotta-500"
                                 />
                                 <span className="text-sm font-medium text-navy-700">{opt.label}</span>
                              </label>
                            ))}
                         </div>
                       </div>
                    </div>
                    <div className="h-px bg-navy-100 my-6" />
                 </div>
               )}

               {/* Budget - Always Shown */}
               <div>
                  <label className=" text-sm font-semibold mb-3 text-navy-700 flex items-center gap-2">
                    <MdAttachMoney /> Budget Range (Monthly)
                  </label>
                  <div className="bg-navy-50 p-6 rounded-xl border border-navy-100">
                    <div className="flex items-center gap-4">
                       <div className="flex-1">
                         <label className="text-xs text-navy-500 mb-1 block">Min Price</label>
                         <div className="relative">
                           <span className="absolute left-3 top-2.5 text-navy-400 text-sm">€</span>
                           <input 
                             type="number"
                             value={formData.budget_min}
                             onChange={(e) => handleChange('budget_min', e.target.value)}
                             className="w-full pl-7 pr-3 py-2 border border-navy-200 rounded-xl text-sm focus:border-terracotta-500 focus:outline-none"
                           />
                         </div>
                       </div>
                       <div className="text-navy-300 font-light text-2xl">-</div>
                       <div className="flex-1">
                         <label className="text-xs text-navy-500 mb-1 block">Max Price</label>
                          <div className="relative">
                           <span className="absolute left-3 top-2.5 text-navy-400 text-sm">€</span>
                           <input 
                             type="number"
                             value={formData.budget_max}
                             onChange={(e) => handleChange('budget_max', e.target.value)}
                             className="w-full pl-7 pr-3 py-2 border border-navy-200 rounded-xl text-sm focus:border-terracotta-500 focus:outline-none"
                           />
                         </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          );

        case 1: // Demographics
          return (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-navy-50 rounded-xl border border-navy-100 mb-6">
                 <h3 className="text-sm font-bold text-navy-900 mb-1">Ideally, who are they?</h3>
                 <p className="text-xs text-navy-700">We don't strictly enforce these, but we prioritize matches that fit.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3 text-navy-700">Preferred Occupations</label>
                <div className="flex flex-wrap gap-2">
                  {OCCUPATION_OPTIONS.map(occ => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => handleCheckboxGroup('occupation_preference', occ)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        (formData.occupation_preference || []).includes(occ)
                          ? 'bg-navy-900 text-white border-navy-900 shadow-md transform scale-105'
                          : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50'
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-heading font-semibold mb-3 text-navy-700">Age Range</label>
                   <div className="flex items-center gap-3 bg-navy-50 p-3 rounded-2xl border border-navy-100">
                     <input 
                       type="number" 
                       value={formData.age_min}
                       onChange={(e) => handleChange('age_min', parseInt(e.target.value))}
                       className="w-16 p-2 border border-navy-200 rounded-xl text-center text-sm focus:border-terracotta-500 focus:outline-none"
                     />
                     <span className="text-navy-400 text-sm">to</span>
                     <input 
                       type="number" 
                       value={formData.age_max}
                       onChange={(e) => handleChange('age_max', parseInt(e.target.value))}
                       className="w-16 p-2 border border-navy-200 rounded-xl text-center text-sm focus:border-terracotta-500 focus:outline-none"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-heading font-semibold mb-3 text-navy-700">Gender Preference</label>
                   <div className="flex flex-wrap gap-2">
                     {['any', 'male', 'female'].map((opt) => (
                       <button
                         key={opt}
                         type="button"
                         onClick={() => handleChange('gender_preference', opt)}
                         className={`px-4 py-2 rounded-xl text-sm font-heading font-medium transition-all ${
                           formData.gender_preference === opt
                             ? 'bg-navy-900 text-white shadow-sm'
                             : 'bg-navy-50 text-navy-600 hover:bg-navy-100 border border-navy-200'
                         }`}
                       >
                         {opt === 'any' ? 'Any' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                       </button>
                     ))}
                   </div>
                 </div>
              </div>
            </div>
          );

         case 2: // Habits / Dealbreakers
          return (
             <div className="space-y-6 animate-fadeIn">
                {/* Context note for seekers */}
                {userRole === 'seeker' && (
                  <div className="p-3 bg-terracotta-50 rounded-2xl border border-terracotta-100">
                    <p className="text-xs text-terracotta-700 font-medium">These are your dealbreakers — we'll filter out hosts/spaces that don't match.</p>
                  </div>
                )}

                <div className="space-y-6">
                    <div>
                       <label className="block text-sm font-heading font-semibold mb-2 text-navy-700">
                         {userRole === 'seeker' ? 'Smoking — what can you live with?' : 'Smoking'}
                       </label>
                       <div className="space-y-2">
                         {[
                           { val: 'no', label: userRole === 'seeker' ? 'Non-smoker only' : 'Non-smoker' },
                           { val: 'outside', label: 'Outside smoking is fine' },
                           { val: 'inside', label: 'Indoor smoking is fine' }
                         ].map((opt) => (
                           <label key={opt.val} className="flex items-center gap-2.5 p-3 border border-navy-200 rounded-2xl hover:bg-navy-50 cursor-pointer transition-colors">
                             <input 
                               type="checkbox"
                               checked={(formData.accepted_smoking || []).includes(opt.val)}
                               onChange={() => handleCheckboxGroup('accepted_smoking', opt.val)}
                               className="rounded text-terracotta-600 focus:ring-terracotta-600 w-4 h-4"
                             />
                             <span className="text-sm font-medium text-navy-700">{opt.label}</span>
                           </label>
                         ))}
                       </div>
                    </div>

                    {/* Seeker: Cleanliness tolerance */}
                    {userRole === 'seeker' && (
                      <div>
                        <label className="block text-sm font-heading font-semibold mb-2 text-navy-700">Minimum cleanliness standard</label>
                        <div className="space-y-2">
                          {[
                            { val: 'relaxed', label: 'Relaxed — some mess is fine', emoji: '🧺' },
                            { val: 'moderate', label: 'Moderate — common areas kept tidy', emoji: '🧹' },
                            { val: 'high', label: 'High — everything kept clean', emoji: '✨' },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => handleChange('cleanliness_tolerance', opt.val)}
                              className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                                formData.cleanliness_tolerance === opt.val
                                  ? 'border-terracotta-500 bg-terracotta-50 ring-1 ring-terracotta-500'
                                  : 'border-navy-200 hover:border-navy-300'
                              }`}
                            >
                              <span className="text-lg">{opt.emoji}</span>
                              <span className="text-sm font-medium text-navy-800">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seeker: Overnight guests tolerance */}
                    {userRole === 'seeker' && (
                      <div>
                        <label className="block text-sm font-heading font-semibold mb-2 text-navy-700">How often can the host have overnight guests?</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { val: 'never', label: 'Never' },
                            { val: 'rarely', label: 'Rarely' },
                            { val: 'occasionally', label: 'Occasionally' },
                            { val: 'any', label: "I don't mind" },
                          ].map(opt => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => handleChange('guests_tolerance', opt.val)}
                              className={`p-2.5 rounded-2xl border transition-all text-center text-sm font-medium ${
                                formData.guests_tolerance === opt.val
                                  ? 'border-terracotta-600 bg-terracotta-600 text-white shadow-md'
                                  : 'border-navy-200 text-navy-700 hover:border-navy-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                       <label className="block text-sm font-heading font-semibold mb-2 text-navy-700">
                         {userRole === 'seeker' ? 'Pets — can you live with them?' : 'Pets'}
                       </label>
                       <div className="p-4 bg-navy-50 rounded-2xl border border-navy-100">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={formData.accepted_pets}
                              onChange={(e) => handleChange('accepted_pets', e.target.checked)}
                              className="rounded text-terracotta-600 focus:ring-terracotta-600 h-5 w-5"
                            />
                            <div>
                               <div className="font-medium text-sm text-navy-950">{userRole === 'seeker' ? "Yes, I can live with pets" : "I accept pets"}</div>
                               <div className="text-xs text-navy-500">{userRole === 'seeker' ? "Check if you're okay with a host/space that has pets" : "Only check if you are okay living with animals"}</div>
                            </div>
                          </label>
                       </div>
                    </div>
                </div>
             </div>
          );
        default: return null;
     }
  };

  const renderSummaryCard = () => (
    <div className="bg-white rounded-3xl border border-navy-100 p-6 animate-fadeIn">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-terracotta-50 text-terracotta-600 rounded-xl">
             <MdFilterList className="text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-navy-950">Your Roommate Preferences</h2>
            <p className="text-navy-500 text-sm">We use this to find your best matches.</p>
          </div>
        </div>
        <button 
          onClick={() => setMode('edit')}
          className="flex items-center gap-2 px-4 py-2 bg-navy-50 hover:bg-navy-100 text-navy-700 rounded-xl text-sm font-heading font-medium transition-colors border border-navy-200"
        >
          <MdEdit /> Edit Preferences
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Card 1: Budget & Location */}
        <div className="p-4 bg-navy-50 rounded-2xl border border-navy-100">
           <h3 className="text-xs font-heading font-bold text-navy-400 uppercase tracking-wider mb-2">
              {userRole === 'seeker' ? 'Budget & Location' : 'Budget'}
           </h3>
           <div className="text-xl font-heading font-bold text-navy-950 mb-1">
             €{formData.budget_min} - €{formData.budget_max}
           </div>
           
           {userRole === 'seeker' && (
             <div className="mt-3 flex flex-wrap gap-1">
               {(formData.location_areas || []).length > 0 ? (
                  (formData.location_areas || []).slice(0, 3).map(loc => (
                    <span key={loc} className="text-xs px-2.5 py-1 bg-white border border-navy-200 rounded-full text-navy-600">
                      {loc}
                    </span>
                  ))
               ) : <span className="text-xs text-navy-400">Any Location</span>}
               {(formData.location_areas || []).length > 3 && <span className="text-xs text-navy-400">+{(formData.location_areas || []).length - 3} more</span>}
             </div>
           )}
        </div>

        {/* Card 2: Demographics & Move-in */}
        <div className="p-4 bg-navy-50 rounded-2xl border border-navy-100">
           <h3 className="text-xs font-heading font-bold text-navy-400 uppercase tracking-wider mb-2">Requirements</h3>
           <div className="space-y-2">
             {userRole === 'seeker' && (
               <div className="flex items-center gap-2 text-sm text-navy-700">
                 <MdCalendarToday className="text-navy-400" />
                 <span className="capitalize">{formData.move_in_window?.replace('-', ' ') || 'Flexible'}</span>
               </div>
             )}
             <div className="flex items-center gap-2 text-sm text-navy-700">
               <MdWork className="text-navy-400" />
               <span>
                  {(formData.occupation_preference || []).length > 0 
                    ? (formData.occupation_preference || []).join(', ') 
                    : 'Any Occupation'}
               </span>
             </div>
             <div className="text-sm text-navy-600">
               {formData.age_min}-{formData.age_max} yrs • {formData.gender_preference === 'any' ? 'Any Gender' : formData.gender_preference}
             </div>
           </div>
        </div>

        {/* Card 3: Dealbreakers */}
        <div className="p-4 bg-navy-50 rounded-2xl border border-navy-100">
           <h3 className="text-xs font-heading font-bold text-navy-400 uppercase tracking-wider mb-2">
             {userRole === 'seeker' ? 'Dealbreakers' : 'Filters'}
           </h3>
           <ul className="space-y-1.5 text-sm">
             <li className="flex items-center gap-2 text-navy-700">
               {formData.accepted_pets ? <MdCheck className="text-green-500" /> : <span className="text-red-400">✕</span>}
               <span>Pets: {formData.accepted_pets ? 'Accepted' : 'Not preferred'}</span>
             </li>
             <li className="flex items-center gap-2 text-navy-700">
                <span className="font-medium">Smoking:</span>
                <span className="text-navy-600 capitalize">
                   {(formData.accepted_smoking || []).length > 0 
                     ? (formData.accepted_smoking || []).join(', ') 
                     : 'None'}
                </span>
             </li>
             {userRole === 'seeker' && formData.cleanliness_tolerance && (
               <li className="flex items-center gap-2 text-navy-700">
                 <span className="font-medium">Cleanliness:</span>
                 <span className="text-navy-600 capitalize">{formData.cleanliness_tolerance}</span>
               </li>
             )}
             {userRole === 'seeker' && formData.guests_tolerance && (
               <li className="flex items-center gap-2 text-navy-700">
                 <span className="font-medium">Host guests:</span>
                 <span className="text-navy-600 capitalize">{formData.guests_tolerance === 'any' ? "No preference" : formData.guests_tolerance}</span>
               </li>
             )}
           </ul>
        </div>
      </div>
    </div>
  );

  if (mode === 'view') {
    return renderSummaryCard();
  }

  return (
    <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
        {/* Progress Header */}
        <div className="bg-navy-50 border-b border-navy-100 p-5">
           <div className="flex justify-between items-center mb-3">
             <h2 className="text-lg font-bold">{STEPS[currentStep].title}</h2>
             <span className="text-xs font-medium text-navy-500">Step {currentStep + 1} of {STEPS.length}</span>
           </div>
           <div className="h-1.5 bg-navy-200 rounded-full overflow-hidden">
             <div 
               className="h-full bg-terracotta-500 transition-all duration-500 ease-out"
               style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
             />
           </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
           {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-navy-100 flex justify-between bg-white">
           <button
             onClick={() => {
                if(currentStep === 0) setMode('view'); // Cancel if on step 1
                else setCurrentStep(c => c - 1);
             }}
             className="px-4 py-2 rounded-xl font-medium text-navy-600 hover:bg-navy-50 transition-colors text-sm"
           >
             {currentStep === 0 ? 'Cancel' : 'Back'}
           </button>

           <button
             onClick={handleNext}
             className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 text-white rounded-xl font-bold hover:bg-terracotta-600 transition-colors shadow-lg active:scale-95 text-sm"
           >
             {currentStep === STEPS.length - 1 ? (loading ? 'Saving...' : 'Finish') : 'Next'}
             {currentStep < STEPS.length - 1 && <MdWork className="text-white" />} 
           </button>
        </div>
    </div>
  );
}
