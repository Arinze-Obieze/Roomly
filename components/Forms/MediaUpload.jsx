import { MdPhoto, MdClose } from 'react-icons/md';

export default function MediaUpload({ formData, handleFileChange, removeFile }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Add photos and videos of your property
        </h2>
        <p className="text-slate-600">
          Great media helps your listing stand out
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-8">
        {/* Photos - Drag and Drop Area */}
        <div>
          <label className="font-bold text-slate-900 mb-2 block">Photos <span className="text-xs text-slate-500">(at least 1, max 10)</span></label>
          <div
            className="border-2 border-dashed border-cyan-300 rounded-xl p-8 text-center hover:border-cyan-500 hover:bg-cyan-50/50 transition-all cursor-pointer flex flex-col items-center justify-center relative group"
            onClick={() => document.getElementById('photo-upload-input').click()}
            style={{ minHeight: '120px' }}
          >
            <MdPhoto size={48} className="text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-cyan-700">Click or drag to upload photos</span>
            <span className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB each</span>
            <input
              id="photo-upload-input"
              type="file"
              accept="image/*"
              multiple
              onChange={e => handleFileChange(e, 'photos')}
              disabled={formData.photos.length >= 10}
              className="hidden"
            />
            <span className="block text-xs text-slate-400 mt-3">
              <strong>Tip:</strong> For best results, use landscape images with a 4:3 or 3:2 aspect ratio and at least 800px wide.
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {formData.photos.map((file, idx) => (
              <div key={idx} className="relative group overflow-hidden rounded-lg border-2 border-cyan-200 hover:border-cyan-400 transition-all shadow-sm">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Photo ${idx+1}`}
                  className="w-full h-24 object-cover rounded-lg group-hover:scale-105 transition-transform"
                />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile('photos', idx); }}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 hover:bg-white shadow"
                  title="Remove"
                >
                  <MdClose size={16} />
                </button>
                <span className="absolute bottom-1 left-1 bg-cyan-600 text-white text-xs px-2 py-0.5 rounded-full opacity-80">{idx+1}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Videos - Drag and Drop Area */}
        <div>
          <label className="font-bold text-slate-900 mb-2 block">Videos <span className="text-xs text-slate-500">(optional, max 5)</span></label>
          <div
            className="border-2 border-dashed border-cyan-200 rounded-xl p-8 text-center hover:border-cyan-400 hover:bg-cyan-50/50 transition-all cursor-pointer flex flex-col items-center justify-center relative group"
            onClick={() => document.getElementById('video-upload-input').click()}
            style={{ minHeight: '120px' }}
          >
            <MdPhoto size={40} className="text-cyan-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-cyan-600">Click or drag to upload videos</span>
            <span className="text-xs text-slate-500 mt-1">MP4, MOV up to 50MB each</span>
            <input
              id="video-upload-input"
              type="file"
              accept="video/*"
              multiple
              onChange={e => handleFileChange(e, 'videos')}
              disabled={formData.videos.length >= 5}
              className="hidden"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {formData.videos.map((file, idx) => (
              <div key={idx} className="relative group overflow-hidden rounded-lg border-2 border-cyan-100 hover:border-cyan-400 transition-all shadow-sm">
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full h-24 object-cover rounded-lg group-hover:scale-105 transition-transform"
                />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile('videos', idx); }}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 hover:bg-white shadow"
                  title="Remove"
                >
                  <MdClose size={16} />
                </button>
                <span className="absolute bottom-1 left-1 bg-cyan-400 text-white text-xs px-2 py-0.5 rounded-full opacity-80">{idx+1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
