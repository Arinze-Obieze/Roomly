import { MdCalendarToday, MdOutlineEventAvailable, MdVideoCameraBack } from 'react-icons/md';
import InputField from '../InputField';

export default function AvailabilityForm({ formData, handleChange, handleFileChange, removeFile }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Date & Min Stay */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="block text-sm font-heading font-bold text-navy-950 mb-2">
              Available From
              <span className="ml-2 text-xs font-sans font-medium text-terracotta-600">(Required)</span>
            </label>
            <div className="relative">
                <MdCalendarToday className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
                <input
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => handleChange('available_from', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 outline-none font-sans"
                />
            </div>
            <div className="mt-3 flex items-center gap-2">
                 <input 
                    type="checkbox" 
                    id="immediate" 
                    checked={formData.is_immediate}
                    onChange={(e) => {
                        handleChange('is_immediate', e.target.checked);
                        if(e.target.checked) handleChange('available_from', new Date().toISOString().split('T')[0]);
                    }}
                    className="rounded text-terracotta-500 focus:ring-terracotta-500"
                 />
                 <label htmlFor="immediate" className="text-sm text-navy-500 font-sans">Available Immediately</label>
            </div>
        </div>

        <div>
           <label className="block text-sm font-heading font-bold text-navy-950 mb-2">
             Minimum Stay
             <span className="ml-2 text-xs font-sans font-medium text-navy-500">(Optional)</span>
           </label>
           <div className="relative">
               <MdOutlineEventAvailable className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
                <select
                    value={formData.min_stay_months || ''}
                    onChange={(e) => handleChange('min_stay_months', e.target.value)}
                     className="w-full pl-11 pr-4 py-3 rounded-xl border border-navy-200 bg-white focus:ring-2 focus:ring-terracotta-500 outline-none appearance-none font-sans"
                >
                    <option value="">Select duration</option>
                    {[1, 2, 3, 6, 9, 12, 18, 24].map(m => (
                        <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                    ))}
                </select>
           </div>
        </div>
      </div>

      {/* Virtual Tour Video */}
      <div>
        <div className="flex items-center justify-between mb-4">
             <label className="text-sm font-heading font-bold text-navy-950">
              Virtual Tour Video <span className="text-xs font-sans font-medium text-navy-500">(Optional)</span>
             </label>
             <span className="text-xs text-navy-500 bg-navy-100 px-2 py-1 rounded-md font-sans">Highly Recommended</span>
        </div>
        
        <div className="border-2 border-dashed border-navy-300 rounded-xl p-8 text-center hover:bg-navy-50 transition-colors cursor-pointer relative">
             <input 
                type="file" 
                accept="video/*"
                onChange={(e) => handleFileChange(e, 'videos')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             />
             <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdVideoCameraBack size={32} />
             </div>
             <p className="font-heading font-medium text-navy-950">Upload a video tour</p>
             <p className="text-sm text-navy-500 mt-1 font-sans">MP4, MOV up to 20MB</p>
        </div>

        {formData.videos && formData.videos.length > 0 && (
             <div className="mt-4 space-y-2">
                {formData.videos.map((vid, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-navy-50 rounded-lg border border-navy-200">
                        <div className="flex items-center gap-3">
                            <MdVideoCameraBack className="text-navy-400" />
                            <span className="text-sm font-heading font-medium text-navy-700 truncate max-w-[200px]">
                                {vid.name || 'Recorded Video'}
                            </span>
                        </div>
                        <button 
                            onClick={() => removeFile('videos', idx)}
                            className="text-navy-400 hover:text-terracotta-500 text-sm font-sans"
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Private Viewings Toggle */}
      <div className="p-4 rounded-xl bg-navy-50 border border-navy-200 flex items-center justify-between">
            <div>
                <div className="font-heading font-bold text-navy-950">
                  Accept Private Viewings? <span className="text-xs font-sans font-medium text-navy-500">(Optional)</span>
                </div>
                <div className="text-xs text-navy-500 font-sans">Allow users to request specific viewing slots</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.accept_viewings}
                    onChange={(e) => handleChange('accept_viewings', e.target.checked)}
                />
                <div className="w-11 h-6 bg-navy-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-navy-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-950"></div>
            </label>
       </div>

    </div>
  );
}
