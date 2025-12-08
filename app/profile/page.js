"use client";

import { useState } from "react";
import { 
  MdVerified, 
  MdWork, 
  MdSchool, 
  MdLocationOn, 
  MdChatBubble, 
  MdCheckCircle, 
  MdOutlineTimer,
  MdSmokeFree,
  MdPets,
  MdNightlife,
  MdWbSunny,
  MdEdit
} from "react-icons/md";
import { FaLinkedin, FaInstagram } from "react-icons/fa";

// Mock Data simulating the "Phase 2: Intelligent Features"
const userProfile = {
  name: "Sarah Jenkins",
  age: 24,
  location: "Rathmines, Dublin 6",
  role: "UX Designer",
  company: "TechFlow Ltd",
  university: "Trinity College Dublin",
  bio: "Hi! I'm a quiet professional looking for a clean, chill apartment. I work from home 2 days a week. I love cooking on weekends and hiking. Not a party animal, but love a glass of wine on Fridays.",
  matchScore: 94,
  responseRate: "100%",
  responseTime: "< 1 hr",
  verified: true,
  tier: "Gold Verified", // Roadmap Phase 2: Verification Tiers
  traits: [
    { icon: MdWbSunny, label: "Early Bird", match: true },
    { icon: MdSmokeFree, label: "Non-smoker", match: true },
    { icon: MdPets, label: "No Pets", match: true },
    { icon: MdNightlife, label: "Quiet Evenings", match: false }, // Mismatch example
  ],
  interests: ["Hiking", "Photography", "Cooking", "Indie Music"]
};

export default function ProfilePage() {
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans text-slate-900 pb-20">
      
      {/* Background Noise Texture (Consistent with your Design System) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

      {/* Hero / Cover Area */}
    

      <div className="max-w-7xl mx-auto px-6 relative z-10 mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Identity & Quick Stats */}
          <div className="space-y-6">
            
            {/* Main Profile Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 overflow-hidden relative">
              <div className="flex flex-col items-center text-center">
                
                {/* Avatar with Status Dot */}
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full p-1 bg-white ring-4 ring-slate-100">
                    <img 
                      src="https://i.pravatar.cc/300?img=5" 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full" title="Online Now"></div>
                </div>

                {/* Name & Verification */}
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">{userProfile.name}, {userProfile.age}</h1>
                  {userProfile.verified && (
                    <MdVerified className="text-cyan-500 text-xl" title="Identity Verified" />
                  )}
                </div>
                
                <p className="text-slate-500 mb-6 flex items-center gap-1 text-sm">
                  <MdLocationOn /> {userProfile.location}
                </p>

                {/* CTA Buttons */}
                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                  <button className="col-span-2 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <MdChatBubble /> Send Message
                  </button>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-slate-100 mb-6"></div>

                {/* Quick Info List */}
                <div className="w-full space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                      <MdWork />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Occupation</p>
                      <p className="text-sm font-medium">{userProfile.role} at {userProfile.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                      <MdSchool />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Education</p>
                      <p className="text-sm font-medium">{userProfile.university}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification & Trust Card (Phase 2 Goal) */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MdCheckCircle className="text-emerald-500" /> Trust Score
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-sm font-medium text-emerald-800">Government ID</span>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">VERIFIED</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm font-medium text-slate-600">LinkedIn</span>
                  <FaLinkedin className="text-slate-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm font-medium text-slate-600">Phone Number</span>
                  <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">VERIFIED</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Detailed Info & Compatibility */}
          <div className="lg:col-span-2 space-y-6">

            {/* Compatibility Banner (The "Algorithm" from Roadmap) */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                      Algorithmic Match
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Exceptional Match</h2>
                  <p className="text-slate-300 max-w-md">
                    Based on 50+ data points including sleep schedule, cleanliness, and guest policy.
                  </p>
                </div>
                
                {/* Score Circle */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-700" />
                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * 94) / 100} className="text-cyan-400" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold">94%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About & Habits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bio Section */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 md:col-span-2">
                <h3 className="text-xl font-bold text-slate-900 mb-4">About Me</h3>
                <p className="text-slate-600 leading-relaxed">
                  {userProfile.bio}
                </p>
                
                <div className="mt-6 flex flex-wrap gap-2">
                  {userProfile.interests.map((tag) => (
                    <span key={tag} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lifestyle Habits (Intelligent Features) */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 md:col-span-2">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Lifestyle & Habits</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {userProfile.traits.map((trait, index) => (
                    <div 
                      key={index}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        trait.match 
                          ? 'bg-cyan-50 border-cyan-100 text-cyan-900' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 opacity-70'
                      }`}
                    >
                      <trait.icon className={`text-2xl mb-2 ${trait.match ? 'text-cyan-600' : 'text-slate-400'}`} />
                      <span className="text-sm font-semibold text-center">{trait.label}</span>
                      {trait.match && (
                        <span className="mt-2 text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-cyan-600 shadow-sm">
                          MATCH
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Accountability Stats (Roadmap Phase 2) */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                    <MdOutlineTimer size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Response Time</h4>
                    <p className="text-xs text-slate-500">Based on last 10 messages</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900">{userProfile.responseTime}</div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <MdChatBubble size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Response Rate</h4>
                    <p className="text-xs text-slate-500">Very responsive</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900">{userProfile.responseRate}</div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}