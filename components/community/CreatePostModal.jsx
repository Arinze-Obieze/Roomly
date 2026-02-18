'use client';

import { useState } from 'react';
import { MdClose, MdImage } from 'react-icons/md';
import { createClient } from '@/core/utils/supabase/client';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'general', label: 'General Discussion', icon: '💬' },
  { value: 'event', label: 'Local Event', icon: '📅' },
  { value: 'tip', label: 'City Tip', icon: '💡' },
  { value: 'scam_alert', label: 'Scam Alert', icon: '🚨' },
  { value: 'news', label: 'Local News', icon: '📰' },
];

export default function CreatePostModal({ onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    city: '',
    image: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let image_url = null;
      const supabase = createClient();
      
      // Upload Image if present
      if (formData.image) {
        const fileName = `community/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { error: uploadError } = await supabase.storage
          .from('property-media') // Reusing existing bucket or create 'community-media'
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;
        
        // Get public URL
        image_url = supabase.storage.from('property-media').getPublicUrl(fileName).data.publicUrl;
      }

      // Create Post
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          city: formData.city,
          image_url
        }),
      });

      if (!res.ok) throw new Error('Failed to create post');

      toast.success('Post created successfully!');
      if (onCreated) onCreated();
      onClose();

    } catch (error) {
      console.error(error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Create New Post</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  className={`p-3 rounded-xl border text-left text-sm transition-all flex items-center gap-2 ${
                    formData.category === cat.value
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              required
              placeholder="Give your post a catchy title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              required
              placeholder="e.g. Dublin, Cork"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Share your thoughts, tips, or event details..."
              value={formData.content}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image (Optional)</label>
            <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${formData.image ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-300'}`} onClick={() => document.getElementById('post-image').click()}>
              <input type="file" id="post-image" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div className="flex flex-col items-center gap-1 text-sm text-slate-500">
                <MdImage size={24} className={formData.image ? 'text-cyan-600' : 'text-slate-400'} />
                <span>{formData.image ? formData.image.name : 'Click to upload image'}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Create Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
