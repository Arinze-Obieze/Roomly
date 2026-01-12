'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PremiumSlider from '@/components/ui/PremiumSlider';
import { MdSchedule, MdCleaningServices, MdPets, MdMusicNote, MdLocalBar, MdSmokeFree, MdCheck, MdArrowForward, MdArrowBack, MdEdit } from 'react-icons/md';
import { FaCannabis } from 'react-icons/fa';
import toast from 'react-hot-toast';

const STEPS = [
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
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm animate-fadeIn">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Lifestyle Profile</h2>
          <p className="text-slate-500">This is how you appear to potential rentmates.</p>
        </div>
        <button 
          onClick={() => setMode('edit')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
        >
          <MdEdit /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Key Stats */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Daily Rhythm</h3>
             <ul className="space-y-3">
               <li className="flex items-center gap-3">
                 <span className="text-xl">📅</span>
                 <span className="font-medium text-slate-700 capitalize">{formData.schedule_type} Schedule</span>
               </li>
               <li className="flex items-center gap-3">
                 <span className="text-xl">🚬</span>
                 <span className="font-medium text-slate-700 capitalize">
                   {formData.smoking_status === 'no' ? 'Non-smoker' : formData.smoking_status === 'outside' ? 'Outdoor Smoker' : 'Indoor Smoker'}
                 </span>
               </li>
               <li className="flex items-center gap-3">
                 <span className="text-xl">🥂</span>
                 <span className="font-medium text-slate-700 capitalize">{formData.drinking_habits} Drinker</span>
               </li>
               {formData.cannabis_friendly && (
                 <li className="flex items-center gap-3">
                   <span className="text-xl text-green-600"><FaCannabis /></span>
                   <span className="font-medium text-slate-700">Cannabis Friendly</span>
                 </li>
               )}
             </ul>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Logistics</h3>
             <ul className="space-y-3">
               <li className="flex items-center gap-3">
                 <span className="text-xl">🛌</span>
                 <span className="font-medium text-slate-700">Guests: <span className="capitalize">{formData.overnight_guests}</span></span>
               </li>
               <li className="flex items-center gap-3">
                 <span className="text-xl">🥗</span>
                 <span className="font-medium text-slate-700 capitalize">{formData.dietary_preference}</span>
               </li>
               <li className="flex items-center gap-3">
                 <span className="text-xl">🐶</span>
                 <span className="font-medium text-slate-700">
                   {formData.pets.has_pets ? `Has Pets: ${formData.pets.description}` : 'No Pets'}
                 </span>
               </li>
             </ul>
          </div>
        </div>

        {/* Levels */}
        <div className="space-y-6">
           <div className="space-y-6">
              {[
                { label: 'Cleanliness', val: formData.cleanliness_level, icon: <MdCleaningServices /> },
                { label: 'Social Battery', val: formData.social_level, icon: <MdLocalBar /> },
                { label: 'Noise Tolerance', val: formData.noise_tolerance, icon: <MdMusicNote /> },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium flex items-center gap-2 text-slate-700">{stat.icon} {stat.label}</span>
                    <span className="text-slate-400 text-sm">{stat.val}/3</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900" style={{ width: `${(stat.val / 3) * 100}%` }} />
                  </div>
                </div>
              ))}
           </div>

           <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Interests</h3>
             <div className="flex flex-wrap gap-2">
               {formData.interests && formData.interests.length > 0 ? (
                 formData.interests.map(tag => (
                   <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                     {tag}
                   </span>
                 ))
               ) : (
                 <span className="text-slate-400 italic">No interests added yet</span>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch(currentStep) {
      case 0: // Basics
        return (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <label className="block text-lg font-semibold mb-4">What's your typical schedule?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['9-5', 'shift', 'student', 'wfh', 'mixed'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleChange('schedule_type', type)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.schedule_type === type 
                        ? 'border-slate-900 bg-slate-50' 
                        : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium capitalise">{type === 'wfh' ? 'Work From Home' : type.charAt(0).toUpperCase() + type.slice(1)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-semibold mb-4">Smoking Habits</label>
                <div className="space-y-3">
                  {[
                    { val: 'no', label: 'I don\'t smoke', icon: <MdSmokeFree /> },
                    { val: 'outside', label: 'Outside only', icon: <MdSmokeFree className="opacity-50" /> },
                    { val: 'inside', label: 'I smoke inside', icon: <MdSmokeFree className="text-red-500" /> }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => handleChange('smoking_status', opt.val)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        formData.smoking_status === opt.val
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold mb-4">Drinking & Others</label>
                <div className="space-y-4">
                  <select 
                    value={formData.drinking_habits}
                    onChange={(e) => handleChange('drinking_habits', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="non-drinker">Not really a drinker</option>
                    <option value="social">Social drinker</option>
                    <option value="frequent">Regular drinker</option>
                  </select>

                   <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50">
                    <input 
                      type="checkbox"
                      checked={formData.cannabis_friendly}
                      onChange={(e) => handleChange('cannabis_friendly', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <FaCannabis className="text-green-600 text-xl" />
                    <span className="font-medium">Cannabis Friendly / User</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div>
                 <label className="block text-lg font-semibold mb-4">Dietary Preferences</label>
                 <select 
                    value={formData.dietary_preference}
                    onChange={(e) => handleChange('dietary_preference', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white"
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

      case 1: // Habits
        return (
          <div className="space-y-12 animate-fadeIn py-4">
            <div>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
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
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
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
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
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

      case 2: // Logistics
        return (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <label className="block text-lg font-semibold mb-4">Overnight Guests</label>
              <div className="grid grid-cols-2 gap-3">
                {['never', 'rarely', 'occasionally', 'frequently'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleChange('overnight_guests', freq)}
                    className={`p-3 rounded-xl border transition-all text-center ${
                      formData.overnight_guests === freq
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
               <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                 <MdPets /> Pets
               </h3>
               
               <div className="space-y-4">
                 <label className="flex items-center gap-3">
                   <input 
                     type="checkbox"
                     checked={formData.pets.has_pets}
                     onChange={(e) => handleChange('pets', { ...formData.pets, has_pets: e.target.checked })}
                     className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                   />
                   <span className="font-medium">I have pets</span>
                 </label>

                 {formData.pets.has_pets && (
                   <textarea
                     value={formData.pets.description}
                     onChange={(e) => handleChange('pets', { ...formData.pets, description: e.target.value })}
                     placeholder="Tell us about your pet (e.g., 2 year old Golden Retriever, very friendly)"
                     className="w-full p-3 rounded-xl border border-slate-200"
                     rows={2}
                   />
                 )}
                 
                 <div className="h-px bg-slate-200 my-4" />
                 
                 <label className="flex items-center gap-3">
                   <input 
                     type="checkbox"
                     checked={formData.pets.accepts_pets}
                     onChange={(e) => handleChange('pets', { ...formData.pets, accepts_pets: e.target.checked })}
                     className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                   />
                   <span className="font-medium">I'm comfortable living with pets</span>
                 </label>
               </div>
            </div>
          </div>
        );

      case 3: // Vibe
        return (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <label className="block text-lg font-semibold mb-2">Interests & Hobbies</label>
              <p className="text-slate-500 mb-6">Select everything that you enjoy!</p>
              
              <div className="flex flex-wrap gap-2">
                {INTEREST_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 active:scale-95 ${
                      formData.interests.includes(tag)
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
               <h3 className="font-medium text-yellow-900 mb-2">💡 Pro Tip</h3>
               <p className="text-sm text-yellow-800">
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
      <div className="bg-slate-50 border-b border-slate-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{STEPS[currentStep].title}</h2>
          <span className="text-sm font-medium text-slate-500">Step {currentStep + 1} of {STEPS.length}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-900 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Footer / Navigation */}
      <div className="p-6 border-t border-slate-100 flex justify-between bg-white">
        <button
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-colors ${
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
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-medium shadow-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : currentStep === STEPS.length - 1 ? 'Complete Profile' : 'Next Step'}
          {!loading && currentStep < STEPS.length - 1 && <MdArrowForward />}
          {!loading && currentStep === STEPS.length - 1 && <MdCheck />}
        </button>
      </div>
    </div>
  );
}
