'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { MdSave, MdCameraAlt } from 'react-icons/md';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ProfileForm({ onCancel }) {
  const { user, updateProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Form state
  // We use fallback to empty string to keep inputs controlled
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
    bio: user?.bio || '',
    date_of_birth: user?.date_of_birth || '',
    privacy_setting: user?.privacy_setting || 'public',
  });

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

    // Set immediate preview
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

      // Immediately update profile with new avatar
      const { success, error } = await updateProfile({ profile_picture: publicUrl });
      
      if (success) {
        toast.success('Avatar updated!');
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      setPreviewUrl(null); // Revert preview on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Sanitize payload
    const payload = {
      ...formData,
      // Convert empty string date to null to avoid backend invalid input syntax
      date_of_birth: formData.date_of_birth === '' ? null : formData.date_of_birth
    };

    try {
      const { success, error } = await updateProfile(payload);
      
      if (success) {
        toast.success('Profile updated successfully');
        onCancel(); // Exit edit mode
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="col-span-1 md:col-span-2">
           <label className="block text-sm font-medium text-slate-700 mb-2">Profile Picture</label>
           <div className="flex items-center gap-4">
             <img 
               src={previewUrl || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=random`}
               alt="Avatar"
               className="w-16 h-16 rounded-full object-cover border border-slate-200"
             />
             <label className="cursor-pointer bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors flex items-center gap-2">
               <MdCameraAlt />
               Change Photo
               <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 onChange={handleImageUpload}
                 disabled={loading}
               />
             </label>
           </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Profile Privacy</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, privacy_setting: 'public' }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.privacy_setting === 'public' 
                        ? 'border-cyan-600 bg-cyan-50/50' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                >
                    <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${formData.privacy_setting === 'public' ? 'bg-cyan-600' : 'bg-slate-300'}`} />
                        Public Profile
                    </div>
                    <p className="text-xs text-slate-500">Your full profile is visible to landlords.</p>
                </button>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, privacy_setting: 'private' }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.privacy_setting === 'private' 
                        ? 'border-cyan-600 bg-cyan-50/50' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                >
                    <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${formData.privacy_setting === 'private' ? 'bg-cyan-600' : 'bg-slate-300'}`} />
                        Private Profile
                    </div>
                    <p className="text-xs text-slate-500">Hide your identity until you show interest in a room.</p>
                </button>
            </div>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all resize-none"
            placeholder="Tell us a bit about yourself..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-xl text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <MdSave />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
