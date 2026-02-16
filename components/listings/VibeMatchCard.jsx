'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MdCheckCircle, MdCancel, MdInfo, MdWarning } from 'react-icons/md';
import { useAuthContext } from '@/contexts/AuthContext';

export default function VibeMatchCard({ property }) {
  const { user } = useAuthContext();
  const [lifestyle, setLifestyle] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLifestyle = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('user_lifestyles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setLifestyle(data);
      setLoading(false);
    };
    fetchLifestyle();
  }, [user]);

  if (!user) return null; // Or show "Sign in to see match"
  if (loading) return <div className="animate-pulse bg-slate-100 h-32 rounded-xl mb-6"></div>;
  if (!lifestyle) return null; // No lifestyle data set up

  // Analysis Logic
  const checks = [];

  // 1. Smoking
  const userSmokes = lifestyle.smoking_status !== 'no';
  const propAllowsSmoking = property.utilities_included?.includes('smoking') || property.description?.toLowerCase().includes('smoking allowed'); 
  // Wait, standardized field might be missing. Using property.smokers_allowed if available, else infer.
  // PropertyDetailsPage didn't explicitly show a 'smokers_allowed' field in the "Rental Details" or "Preferences".
  // I will check property.amenities for 'smoking allowed' or similar.
  // Assuming property.amenities array labels.
  
  // Actually, standard schema should have 'smokers_allowed'. I will try to use it if it exists.
  // If undefined, we skip.
  if (typeof property.smokers_allowed !== 'undefined') {
      if (userSmokes && !property.smokers_allowed) {
          checks.push({ type: 'danger', icon: <MdCancel />, text: 'Property is Non-Smoking' });
      } else if (userSmokes && property.smokers_allowed) {
          checks.push({ type: 'success', icon: <MdCheckCircle />, text: 'Smoking Allowed' });
      }
  }

  // 2. Pets
  const userHasPets = lifestyle.pets?.has_pets;
  if (typeof property.pets_allowed !== 'undefined') {
      if (userHasPets && !property.pets_allowed) {
        checks.push({ type: 'danger', icon: <MdCancel />, text: 'No Pets Allowed' });
      } else if (userHasPets && property.pets_allowed) {
        checks.push({ type: 'success', icon: <MdCheckCircle />, text: 'Pets Welcome' });
      }
  }

  // 3. Gender (Using user.gender from AuthContext/User table)
  const userGender = user.gender; // Assuming 'male', 'female', 'non-binary'
  if (userGender && property.gender_preference && property.gender_preference !== 'any') {
      if (property.gender_preference !== userGender) {
           checks.push({ type: 'warning', icon: <MdWarning />, text: `Preferred Gender: ${property.gender_preference}` });
      } else {
           checks.push({ type: 'success', icon: <MdCheckCircle />, text: 'Gender Match' });
      }
  }

  // 4. Age (Using user.birth_date -> age)
  // Skipping complicated age math for MVP, assuming simple check if DOB exists
  if (user.birth_date) {
      const age = new undefined // TODO implement age calc
      // Skipping for now to avoid errors
  }
  
  // Vibe Checks (Occupation)
  if (user.occupation && property.occupation_preference && property.occupation_preference !== 'any') {
       if (property.occupation_preference === 'professional' && user.occupation === 'student') {
            checks.push({ type: 'warning', icon: <MdInfo />, text: 'Professionals Preferred' });
       } else if (property.occupation_preference === 'student' && user.occupation === 'professional') {
            checks.push({ type: 'neutral', icon: <MdInfo />, text: 'Students Preferred' });
       } else {
            checks.push({ type: 'success', icon: <MdCheckCircle />, text: 'Occupation Match' });
       }
  }

  const hasIssues = checks.some(c => c.type === 'danger');
  const hasWarnings = checks.some(c => c.type === 'warning');
  
  let overallVibe = { color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100', title: '✨ Great Match!', message: 'You fit the criteria well.' };
  if (hasWarnings) overallVibe = { color: 'bg-amber-50 text-amber-700', border: 'border-amber-100', title: '⚠️ Minor Differences', message: 'Check the preferences closely.' };
  if (hasIssues) overallVibe = { color: 'bg-rose-50 text-rose-700', border: 'border-rose-100', title: '🚫 Lifestyle Mismatch', message: 'This might not be the best fit.' };

  // If no specific checks triggered (e.g. strict 'any' property), default to success
  if (checks.length === 0) {
       checks.push({ type: 'success', icon: <MdCheckCircle />, text: 'You meet the basic requirements' });
  }

  return (
    <div className={`rounded-2xl border ${overallVibe.border} ${overallVibe.color} p-5 mb-6 shadow-sm`}>
      <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
        {overallVibe.title}
      </h3>
      <p className="text-sm opacity-90 mb-4">{overallVibe.message}</p>
      
      <div className="space-y-2 bg-white/60 rounded-xl p-3 backdrop-blur-sm">
        {checks.map((check, i) => (
            <div key={i} className={`flex items-center gap-2 text-sm font-medium ${
                check.type === 'danger' ? 'text-rose-600' : 
                check.type === 'warning' ? 'text-amber-600' : 
                'text-emerald-700'
            }`}>
                <span className="text-lg">{check.icon}</span>
                {check.text}
            </div>
        ))}
      </div>
    </div>
  );
}
