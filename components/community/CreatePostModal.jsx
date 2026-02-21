'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdClose, MdImage, MdAddPhotoAlternate } from 'react-icons/md';
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
    image: null,
    isAnonymous: false
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
      // Get CSRF token
      const csrfRes = await fetch('/api/csrf-token');
      if (!csrfRes.ok) throw new Error('Failed to get CSRF token');
      const { csrfToken } = await csrfRes.json();

      let image_url = null;
      const supabase = createClient();
      
      if (formData.image) {
        const fileName = `community/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;
        
        image_url = supabase.storage.from('property-media').getPublicUrl(fileName).data.publicUrl;
      }

      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          city: formData.city,
          image_url,
          is_anonymous: formData.isAnonymous,
          csrfToken
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-navy-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-navy-100">
          <h2 className="text-lg font-heading font-bold text-navy-950">Create New Post</h2>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="p-2 hover:bg-navy-50 rounded-full text-navy-500 transition-colors"
          >
            <MdClose size={20} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-heading font-bold text-navy-950 mb-1">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <motion.button
                  key={cat.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  className={`p-3 rounded-xl border text-left text-sm transition-all flex items-center gap-2 ${
                    formData.category === cat.value
                      ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700 ring-1 ring-terracotta-500'
                      : 'border-navy-200 hover:border-navy-300 text-navy-600'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="font-heading font-medium">{cat.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-heading font-bold text-navy-950 mb-1">Title</label>
            <input
              type="text"
              name="title"
              required
              placeholder="Give your post a catchy title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 font-sans placeholder-navy-400"
            />
          </div>

          <div>
            <label className="block text-sm font-heading font-bold text-navy-950 mb-1">City</label>
            <input
              type="text"
              name="city"
              required
              placeholder="e.g. Dublin, Cork"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 font-sans placeholder-navy-400"
            />
          </div>

          <div>
            <label className="block text-sm font-heading font-bold text-navy-950 mb-1">Content</label>
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Share your thoughts, tips, or event details..."
              value={formData.content}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 resize-none font-sans placeholder-navy-400"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-navy-50 border border-navy-200">
            <input
              type="checkbox"
              id="anonymous-toggle"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
              className="w-5 h-5 rounded cursor-pointer accent-terracotta-500"
            />
            <label htmlFor="anonymous-toggle" className="cursor-pointer flex-1">
              <span className="text-sm font-heading font-semibold text-navy-950">Post Anonymously</span>
              <p className="text-xs text-navy-500 mt-0.5">Your name won't be shown with this post</p>
            </label>
          </div>

          <div>
            <label className="block text-sm font-heading font-bold text-navy-950 mb-1">Image (Optional)</label>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                formData.image ? 'border-terracotta-500 bg-terracotta-50' : 'border-navy-200 hover:border-terracotta-300'
              }`} 
              onClick={() => document.getElementById('post-image').click()}
            >
              <input type="file" id="post-image" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div className="flex flex-col items-center gap-1 text-sm text-navy-500">
                {formData.image ? (
                  <>
                    <MdAddPhotoAlternate size={24} className="text-terracotta-500" />
                    <span className="font-heading text-terracotta-600">{formData.image.name}</span>
                  </>
                ) : (
                  <>
                    <MdImage size={24} className="text-navy-400" />
                    <span className="font-sans">Click to upload image</span>
                    <span className="text-xs text-navy-400">PNG, JPG up to 5MB</span>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-terracotta-500 text-white rounded-xl font-heading font-semibold hover:bg-terracotta-600 transition-all shadow-lg shadow-terracotta-500/20 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Create Post'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}