import { MdPhoto, MdClose, MdVideoCameraBack } from 'react-icons/md';

export default function MediaUpload({ formData, handleFileChange, removeFile }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-heading font-bold text-navy-950 mb-2">
          Add photos and videos of your property
        </h2>
        <p className="text-navy-500 font-sans">
          Great media helps your listing stand out
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-navy-200 p-6 space-y-8">
        {/* Photos - Drag and Drop Area */}
        <div>
          <label className="font-heading font-bold text-navy-950 mb-2 block">
            Photos <span className="text-xs text-terracotta-600 font-sans">(Required, at least 1, max 10)</span>
          </label>
          <div
            className="border-2 border-dashed border-terracotta-300 rounded-xl p-8 text-center hover:border-terracotta-500 hover:bg-terracotta-50/50 transition-all cursor-pointer flex flex-col items-center justify-center relative group"
            onClick={() => document.getElementById('photo-upload-input').click()}
            style={{ minHeight: '120px' }}
          >
            <MdPhoto size={48} className="text-terracotta-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-heading font-semibold text-terracotta-700">Click or drag to upload photos</span>
            <span className="text-xs text-navy-500 mt-1 font-sans">PNG, JPG up to 5MB each</span>
            <input
              id="photo-upload-input"
              type="file"
              accept="image/*"
              multiple
              onChange={e => handleFileChange(e, 'photos')}
              disabled={(formData.photos || []).length >= 10}
              className="hidden"
            />
            <span className="block text-xs text-navy-400 mt-3 font-sans">
              <strong className="text-navy-600">Tip:</strong> For best results, use landscape images with a 4:3 or 3:2 aspect ratio and at least 800px wide.
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(formData.photos || []).map((file, idx) => (
              <div key={idx} className="relative group overflow-hidden rounded-lg border-2 border-terracotta-200 hover:border-terracotta-500 transition-all shadow-sm">
                <img
                  src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                  alt={`Photo ${idx+1}`}
                  className="w-full h-24 object-cover rounded-lg group-hover:scale-105 transition-transform"
                />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile('photos', idx); }}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-terracotta-500 hover:bg-white shadow"
                  title="Remove"
                >
                  <MdClose size={16} />
                </button>
                <span className="absolute bottom-1 left-1 bg-terracotta-500 text-white text-xs px-2 py-0.5 rounded-full opacity-80 font-sans">{idx+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Videos - Drag and Drop Area */}
        <div>
          <label className="font-heading font-bold text-navy-950 mb-2 block">
            Videos <span className="text-xs text-navy-500 font-sans">(Optional, max 5)</span>
          </label>
          <div
            className="border-2 border-dashed border-teal-300 rounded-xl p-8 text-center hover:border-teal-500 hover:bg-teal-50/50 transition-all cursor-pointer flex flex-col items-center justify-center relative group"
            onClick={() => document.getElementById('video-upload-input').click()}
            style={{ minHeight: '120px' }}
          >
            <MdVideoCameraBack size={48} className="text-teal-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-heading font-semibold text-teal-700">Click or drag to upload videos</span>
            <span className="text-xs text-navy-500 mt-1 font-sans">MP4, MOV up to 50MB each</span>
            <input
              id="video-upload-input"
              type="file"
              accept="video/*"
              multiple
              onChange={e => handleFileChange(e, 'videos')}
              disabled={(formData.videos || []).length >= 5}
              className="hidden"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(formData.videos || []).map((file, idx) => (
              <div key={idx} className="relative group overflow-hidden rounded-lg border-2 border-teal-200 hover:border-teal-500 transition-all shadow-sm">
                <video
                  src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                  controls
                  className="w-full h-24 object-cover rounded-lg group-hover:scale-105 transition-transform"
                />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile('videos', idx); }}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-teal-500 hover:bg-white shadow"
                  title="Remove"
                >
                  <MdClose size={16} />
                </button>
                <span className="absolute bottom-1 left-1 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full opacity-80 font-sans">{idx+1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
