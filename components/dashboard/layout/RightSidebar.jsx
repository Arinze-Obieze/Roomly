"use client";

import { 
  MdBolt, 
  MdVerified, 
  MdPersonOutline, 
  MdGroups,
  MdCheckCircle 
} from "react-icons/md";

export const RightSidebar = () => {
  return (
    <aside className="hidden 2xl:block fixed right-0 top-[120px] w-80 h-[calc(100vh-120px)] bg-white border-l border-slate-200 p-6 overflow-y-auto">
      {/* Profile Strength Card */}
      <div className="bg-linear-to-br from-navy-900 to-navy-800 rounded-3xl p-6 text-white mb-8 shadow-lg shadow-navy-200">
        <div className="flex items-center gap-2 mb-3 opacity-90">
          <MdBolt className="text-yellow-300" />
          <span className="text-xs font-bold uppercase tracking-wider">Update</span>
        </div>
        <h3 className="text-lg font-bold mb-2">Profile Strength</h3>
        <p className="text-sm opacity-90 mb-4">Complete quiz to improve matches.</p>
        <button className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-colors">
          Take Quiz
        </button>
      </div>

      {/* Identity Status */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Identity Status</h3>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Level 1</span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
              <MdVerified />
            </div>
            <div>
              <p className="text-sm font-bold">Email Verified</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
              <MdPersonOutline />
            </div>
            <div>
              <p className="text-sm font-bold">Gov ID Upload</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Updates */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Community</h3>
          <MdGroups className="text-terracotta-500" />
        </div>
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm font-medium">Dublin Roommate Mixer</p>
            <p className="text-xs text-slate-500">Tomorrow • 6 PM</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm font-medium">5 new members</p>
            <p className="text-xs text-slate-500">Welcome!</p>
          </div>
        </div>
      </div>

      {/* Application Tracker */}
      <div>
        <h3 className="font-bold text-slate-900 mb-4">Your Applications</h3>
        <div className="space-y-3">
          <div className="p-3 bg-navy-50 rounded-xl border border-navy-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold">Modern Studio</p>
              <span className="text-xs bg-navy-100 text-navy-700 px-2 py-1 rounded-full">Pending</span>
            </div>
            <p className="text-xs text-slate-600">Submitted 2 days ago</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold">Ensuite Room</p>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Viewed</span>
            </div>
            <p className="text-xs text-slate-600">Host viewed today</p>
          </div>
        </div>
      </div>
    </aside>
  );
};