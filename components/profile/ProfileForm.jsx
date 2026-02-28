'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdSave, MdCameraAlt, MdCheckCircle } from 'react-icons/md';
import { createClient } from '@/core/utils/supabase/client';
import toast from 'react-hot-toast';
import GlobalSpinner from '@/components/ui/GlobalSpinner';

export default function ProfileForm({ onCancel }) {
  const { user, updateProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
    bio: user?.bio || '',
    date_of_birth: user?.date_of_birth || '',
    privacy_setting: user?.privacy_setting || 'public',
  });

  // Re-populate form when the full user profile loads from AuthContext.
  // On client navigation, the context provides auth-only data first, then fetches
  // the full profile (full_name, bio, etc.) asynchronously — so we must sync.
  useEffect(() => {
    if (!user) return;
    setFormData({
      full_name: user.full_name || '',
      phone_number: user.phone_number || '',
      bio: user.bio || '',
      date_of_birth: user.date_of_birth || '',
      privacy_setting: user.privacy_setting || 'public',
    });
  }, [user?.full_name, user?.phone_number, user?.bio, user?.date_of_birth, user?.privacy_setting]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setLoading(true);
      const supabase = createClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { success, error } = await updateProfile({ profile_picture: publicUrl });
      
      if (success) {
        toast.success('Avatar updated!');
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      date_of_birth: formData.date_of_birth === '' ? null : formData.date_of_birth
    };

    try {
      const { success, error } = await updateProfile(payload);
      
      if (success) {
        setSaveSuccess(true);
        toast.success('Profile updated successfully');
        setTimeout(() => {
          onCancel();
        }, 1000);
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-navy-200 p-6 shadow-xl shadow-navy-950/5"
    >
      <h2 className="text-xl font-heading font-bold text-navy-950 mb-6">Edit Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">Profile Picture</label>
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-terracotta-500/20"
            >
              <img 
                src={previewUrl || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=FF6B6B&color=fff`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer bg-navy-50 border border-navy-200 text-navy-700 px-4 py-2 rounded-xl text-sm font-heading font-medium hover:bg-navy-100 transition-colors flex items-center gap-2"
            >
              <MdCameraAlt className="text-terracotta-500" />
              Change Photo
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={loading}
              />
            </motion.label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all font-sans"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all font-sans"
          />
        </div>

        <div>
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all font-sans"
          />
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">Profile Privacy</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, privacy_setting: 'public' }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.privacy_setting === 'public' 
                  ? 'border-terracotta-500 bg-terracotta-50 shadow-lg shadow-terracotta-500/10' 
                  : 'border-navy-200 bg-navy-50 hover:border-navy-300'
              }`}
            >
              <div className="font-heading font-bold text-navy-950 mb-1 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.privacy_setting === 'public' ? 'bg-terracotta-500' : 'bg-navy-300'}`} />
                Public Profile
              </div>
              <p className="text-xs text-navy-500 font-sans">Your full profile is visible to landlords.</p>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, privacy_setting: 'private' }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.privacy_setting === 'private' 
                  ? 'border-terracotta-500 bg-terracotta-50 shadow-lg shadow-terracotta-500/10' 
                  : 'border-navy-200 bg-navy-50 hover:border-navy-300'
              }`}
            >
              <div className="font-heading font-bold text-navy-950 mb-1 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.privacy_setting === 'private' ? 'bg-terracotta-500' : 'bg-navy-300'}`} />
                Private Profile
              </div>
              <p className="text-xs text-navy-500 font-sans">Hide your identity until you show interest in a room.</p>
            </motion.button>
          </div>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all resize-none font-sans"
            placeholder="Tell us a bit about yourself..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 rounded-xl text-sm font-heading font-medium text-navy-500 hover:bg-navy-50 transition-colors"
        >
          Cancel
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-terracotta-500 text-white rounded-xl text-sm font-heading font-medium hover:bg-terracotta-600 disabled:opacity-50 transition-all shadow-lg shadow-terracotta-500/20"
        >
          {loading ? (
            <GlobalSpinner size="sm" color="white" />
          ) : saveSuccess ? (
            <>
              <MdCheckCircle className="text-white" />
              Saved!
            </>
          ) : (
            <>
              <MdSave />
              Save Changes
            </>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}