'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PremiumSlider from '@/components/ui/PremiumSlider';
import { MdSchedule, MdCleaningServices, MdPets, MdMusicNote, MdLocalBar, MdSmokeFree, MdCheck, MdArrowForward, MdArrowBack, MdEdit } from 'react-icons/md';
import { FaCannabis } from 'react-icons/fa';
import { CITIES_TOWNS } from '@/data/locations';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'role', title: 'Why you\'re here' },
  { id: 'basics', title: 'The Basics' },
  { id: 'habits', title: 'Living Habits' },
  { id: 'logistics', title: 'Logistics' },
  { id: 'vibe', title: 'Vibe & Interests' }
];

const INTEREST_TAGS = [
  'Cooking', 'Fitness', 'Gaming', 'Music', 'Movies', 'Reading', 'Travel', 'Photography', 
  'Yoga', 'Art', 'Tech', 'Outdoors', 'Nightlife', 'Board Games', 'Gardening', 'Fashion'
];

export default function LifestyleWizard({ user, onComplete, initialData }) {
  const [mode, setMode] = useState(initialData ? 'view' : 'edit');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    primary_role: 'seeker',
    current_city: '',
    move_in_urgency: 'flexible',
    schedule_type: '9-5',
    smoking_status: 'no',
    drinking_habits: 'social',
    cannabis_friendly: false,
    dietary_preference: 'omnivore',
    cleanliness_level: 2,
    social_level: 2,
    noise_tolerance: 2,
    overnight_guests: 'occasionally',
    pets: { has_pets: false, accepts_pets: true, description: '' },
    interests: []
  });

  const supabase = createClient();

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      setMode('view');
    }
  }, [initialData]);

  // Keep existing fetch logic for when we mount without initialData but might have data in DB?
  // Actually ProfilePage handles this now, but good to keep as backup or remove.
  // We'll trust initialData mostly, or fetch if not provided.
  useEffect(() => {
    if (!initialData && user?.id) {
       // fetch... logic could go here but let's rely on parent for now to avoid double fetching
       // or we just keep it simple.
    }
  }, [initialData, user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_lifestyles')
        .upsert({ user_id: user.id, ...formData });

      if (error) throw error;
      
      toast.success('Lifestyle profile saved!');
      setMode('view'); // Switch to view mode on save
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error saving lifestyle:', error);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setFormData(prev => {
      const interests = prev.interests || [];
      if (interests.includes(interest)) {
        return { ...prev, interests: interests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...interests, interest] };
      }
    });
  };

  const renderSummaryCard = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fadeIn">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Your Lifestyle Profile</h2>
          <p className="text-slate-500 text-sm">This is how you appear to potential rentmates.</p>
        </div>
        <button 
          onClick={() => setMode('edit')}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <MdEdit /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Stats */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Daily Rhythm</h3>
             <ul className="space-y-2 text-sm">
               <li className="flex items-center gap-2">
                 <span className="text-lg">📅</span>
                 <span className="font-medium text-slate-700 capitalize">{formData.schedule_type} Schedule</span>
               </li>
               <li className="flex items-center gap-2">
                 <span className="text-lg">🚬</span>
                 <span className="font-medium text-slate-700 capitalize">
                   {formData.smoking_status === 'no' ? 'Non-smoker' : formData.smoking_status === 'outside' ? 'Outdoor Smoker' : 'Indoor Smoker'}
                 </span>
               </li>
               <li className="flex items-center gap-2">
                 <span className="text-lg">🥂</span>
                 <span className="font-medium text-slate-700 capitalize">{formData.drinking_habits} Drinker</span>
               </li>
               {formData.cannabis_friendly && (
                 <li className="flex items-center gap-2">
                   <span className="text-lg text-green-600"><FaCannabis /></span>
                   <span className="font-medium text-slate-700">Cannabis Friendly</span>
                 </li>
               )}
             </ul>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Logistics</h3>
             <ul className="space-y-2 text-sm">
               <li className="flex items-center gap-2">
                 <span className="text-lg">🛌</span>
                 <span className="font-medium text-slate-700">Guests: <span className="capitalize">{formData.overnight_guests}</span></span>
               </li>
               <li className="flex items-center gap-2">
                 <span className="text-lg">🥗</span>
                 <span className="font-medium text-slate-700 capitalize">{formData.dietary_preference}</span>
               </li>
               <li className="flex items-center gap-2">
                 <span className="text-lg">🐶</span>
                 <span className="font-medium text-slate-700">
                   {formData.pets.has_pets ? `Has Pets: ${formData.pets.description}` : 'No Pets'}
                 </span>
               </li>
             </ul>
          </div>
        </div>

        {/* Levels */}
        <div className="space-y-4">
           <div className="space-y-4">
              {[
                { label: 'Cleanliness', val: formData.cleanliness_level, icon: <MdCleaningServices /> },
                { label: 'Social Battery', val: formData.social_level, icon: <MdLocalBar /> },
                { label: 'Noise Tolerance', val: formData.noise_tolerance, icon: <MdMusicNote /> },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium flex items-center gap-2 text-slate-700 text-sm">{stat.icon} {stat.label}</span>
                    <span className="text-slate-400 text-xs">{stat.val}/3</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${(stat.val / 3) * 100}%` }} />
                  </div>
                </div>
              ))}
           </div>

           <div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Interests</h3>
             <div className="flex flex-wrap gap-1.5">
               {formData.interests && formData.interests.length > 0 ? (
                 formData.interests.map(tag => (
                   <span key={tag} className="px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-medium border border-cyan-100">
                     {tag}
                   </span>
                 ))
               ) : (
                 <span className="text-slate-400 text-sm italic">No interests added yet</span>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  /* 
    Step 0: Role Selection (New)
    Step 1: The Basics (Schedule, Smoking, etc.)
    Step 2: Living Habits (Cleanliness, Social)
    Step 3: Logistics (Guests, Pets, + Location/Move-In for Seekers)
    Step 4: Vibe (Interests)
  */

  const renderStepContent = () => {
    switch(currentStep) {
      case 0: // Role Selection
        return (
          <div className="space-y-6 animate-fadeIn text-center py-4">
             <div className="mb-8">
               <h3 className="text-xl font-bold text-slate-900">What brings you to Roomly?</h3>
               <p className="text-slate-500">Select your primary goal to help us personalize your experience.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleChange('primary_role', 'host')}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                    formData.primary_role === 'host'
                      ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm">
                    🏠
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-800">I have a place</div>
                    <div className="text-sm text-slate-500">I'm looking for a roommate</div>
                  </div>
                </button>

                <button
                  onClick={() => handleChange('primary_role', 'seeker')}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                    formData.primary_role === 'seeker'
                      ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm">
                    🔍
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-800">I need a place</div>
                    <div className="text-sm text-slate-500">I'm looking for a room</div>
                  </div>
                </button>
             </div>
          </div>
        );

      case 1: // Basics
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-base font-semibold mb-3">What's your typical schedule?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['9-5', 'shift', 'student', 'wfh', 'mixed'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleChange('schedule_type', type)}
                    className={`p-3 rounded-xl border text-left transition-all text-sm ${
                      formData.schedule_type === type 
                        ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium capitalise text-slate-700">{type === 'wfh' ? 'Work From Home' : type.charAt(0).toUpperCase() + type.slice(1)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold mb-3">Smoking Habits</label>
                <div className="space-y-2">
                  {[
                    { val: 'no', label: 'I don\'t smoke', icon: <MdSmokeFree /> },
                    { val: 'outside', label: 'Outside only', icon: <MdSmokeFree className="opacity-50" /> },
                    { val: 'inside', label: 'I smoke inside', icon: <MdSmokeFree className="text-red-500" /> }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => handleChange('smoking_status', opt.val)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-sm ${
                        formData.smoking_status === opt.val
                          ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500 text-slate-800'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold mb-3">Drinking & Others</label>
                <div className="space-y-3">
                  <select 
                    value={formData.drinking_habits}
                    onChange={(e) => handleChange('drinking_habits', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="non-drinker">Not really a drinker</option>
                    <option value="social">Social drinker</option>
                    <option value="frequent">Regular drinker</option>
                  </select>

                   <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${formData.cannabis_friendly ? 'bg-cyan-50 border-cyan-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="checkbox"
                      checked={formData.cannabis_friendly}
                      onChange={(e) => handleChange('cannabis_friendly', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <FaCannabis className="text-cyan-600 text-lg" />
                    <span className="font-medium text-sm text-slate-700">Cannabis Friendly / User</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div>
                 <label className="block text-base font-semibold mb-3">Dietary Preferences</label>
                 <select 
                    value={formData.dietary_preference}
                    onChange={(e) => handleChange('dietary_preference', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="omnivore">Everything / Omnivore</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="halal">Halal</option>
                    <option value="kosher">Kosher</option>
                  </select>
            </div>
          </div>
        );

      case 2: // Habits
        return (
          <div className="space-y-6 animate-fadeIn py-2">
            <div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <MdCleaningServices /> Cleanliness Level
              </h3>
              <PremiumSlider
                value={formData.cleanliness_level}
                onChange={(val) => handleChange('cleanliness_level', val)}
                min={1}
                max={3}
                labels={{
                  1: 'Relaxed - "It can wait"',
                  2: 'Moderate - "Tidy common areas"',
                  3: 'Sparkling - "Everything in place"'
                }}
                icons={{
                  1: '🧺',
                  2: '🧹',
                  3: '✨'
                }}
              />
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <MdLocalBar /> Social Battery
              </h3>
              <PremiumSlider
                value={formData.social_level}
                onChange={(val) => handleChange('social_level', val)}
                min={1}
                max={3}
                labels={{
                  1: 'Private - "Me time"',
                  2: 'Balanced - "Up for a chat"',
                  3: 'Social - "House dinners!"'
                }}
                icons={{
                  1: '🔋',
                  2: '👋',
                  3: '🎉'
                }}
              />
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <MdMusicNote /> Noise Tolerance
              </h3>
              <PremiumSlider
                value={formData.noise_tolerance}
                onChange={(val) => handleChange('noise_tolerance', val)}
                min={1}
                max={3}
                labels={{
                  1: 'Quiet Sanctuary',
                  2: 'Normal Living Noise',
                  3: 'Lively Household'
                }}
                icons={{
                  1: '🤫',
                  2: '🎧',
                  3: '🔊'
                }}
              />
            </div>
          </div>
        );

      case 3: // Logistics
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Seeker Specific Fields */}
            {formData.primary_role === 'seeker' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div>
                   <label className="block text-sm font-semibold mb-2 text-slate-700">Current City/Town</label>
                   <div className="relative">
                      <select
                        value={formData.current_city || ''}
                        onChange={(e) => handleChange('current_city', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-cyan-500 focus:outline-none bg-white appearance-none"
                      >
                        <option value="">Select your city...</option>
                        {CITIES_TOWNS.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-semibold mb-2 text-slate-700">Move-in Urgency</label>
                   <select
                     value={formData.move_in_urgency || 'flexible'}
                     onChange={(e) => handleChange('move_in_urgency', e.target.value)}
                     className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-cyan-500 focus:outline-none bg-white"
                   >
                     <option value="immediately">Immediately</option>
                     <option value="1-month">Within 1 month</option>
                     <option value="2-months">Within 2 months</option>
                     <option value="flexible">Flexible</option>
                   </select>
                 </div>
              </div>
            )}

            <div>
              <label className="block text-base font-semibold mb-3">Overnight Guests</label>
              <div className="grid grid-cols-2 gap-2">
                {['never', 'rarely', 'occasionally', 'frequently'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleChange('overnight_guests', freq)}
                    className={`p-2.5 rounded-xl border transition-all text-center text-sm ${
                      formData.overnight_guests === freq
                        ? 'border-cyan-600 bg-cyan-600 text-white shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
               <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                 <MdPets /> Pets
               </h3>
               
               <div className="space-y-3">
                 <label className="flex items-center gap-3 cursor-pointer">
                   <input 
                     type="checkbox"
                     checked={formData.pets.has_pets}
                     onChange={(e) => handleChange('pets', { ...formData.pets, has_pets: e.target.checked })}
                     className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                   />
                   <span className="font-medium text-sm text-slate-700">I have pets</span>
                 </label>

                 {formData.pets.has_pets && (
                   <textarea
                     value={formData.pets.description}
                     onChange={(e) => handleChange('pets', { ...formData.pets, description: e.target.value })}
                     placeholder="Tell us about your pet (e.g., 2 year old Golden Retriever, very friendly)"
                     className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                     rows={2}
                   />
                 )}
                 
                 <div className="h-px bg-slate-200 my-2" />
                 
                 <label className="flex items-center gap-3 cursor-pointer">
                   <input 
                     type="checkbox"
                     checked={formData.pets.accepts_pets}
                     onChange={(e) => handleChange('pets', { ...formData.pets, accepts_pets: e.target.checked })}
                     className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                   />
                   <span className="font-medium text-sm text-slate-700">I'm comfortable living with pets</span>
                 </label>
               </div>
            </div>
          </div>
        );

      case 4: // Vibe
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-base font-semibold mb-1">Interests & Hobbies</label>
              <p className="text-slate-500 text-sm mb-4">Select everything that you enjoy!</p>
              
              <div className="flex flex-wrap gap-2">
                {INTEREST_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all transform hover:scale-105 active:scale-95 ${
                      formData.interests.includes(tag)
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
               <h3 className="font-medium text-yellow-900 mb-1 text-sm">💡 Pro Tip</h3>
               <p className="text-xs text-yellow-800">
                 Users with complete profiles get 3x more responses. Make sure your "About Me" on the main profile tab is also filled out!
               </p>
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  if (mode === 'view') {
    return renderSummaryCard();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-slate-50 border-b border-slate-100 p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">{STEPS[currentStep].title}</h2>
          <span className="text-xs font-medium text-slate-500">Step {currentStep + 1} of {STEPS.length}</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Footer / Navigation */}
      <div className="p-5 border-t border-slate-100 flex justify-between bg-white">
        <button
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors text-sm ${
            currentStep === 0 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MdArrowBack /> Back
        </button>

        <button
          onClick={handleNext}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 text-white rounded-xl font-medium shadow-lg hover:bg-cyan-700 active:scale-95 transition-all disabled:opacity-50 text-sm"
        >
          {loading ? 'Saving...' : currentStep === STEPS.length - 1 ? 'Complete Profile' : 'Next Step'}
          {!loading && currentStep < STEPS.length - 1 && <MdArrowForward />}
          {!loading && currentStep === STEPS.length - 1 && <MdCheck />}
        </button>
      </div>
    </div>
  );
}
