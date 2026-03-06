'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { createClient } from '@/core/utils/supabase/client';
import { MdClose, MdHelpOutline, MdAttachFile, MdDescription } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import bytes from 'bytes';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateTicketModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [attachmentParams, setAttachmentParams] = useState(null);
  const fileInputRef = useRef(null);
  const supabase = createClient();

  if (!isOpen) return null;

  const uploadFileProcess = async (file) => {
    try {
      const lastDot = file.name.lastIndexOf('.');
      const fileExt = lastDot !== -1 ? file.name.slice(lastDot + 1) : '';
      const fileName = fileExt ? `${uuidv4()}.${fileExt}` : uuidv4();
      const filePath = `new_tickets/${fileName}`;

      const { data, error } = await supabase.storage
        .from('support_attachments')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('support_attachments')
        .getPublicUrl(filePath);

      return { publicUrl, filePath };
    } catch (error) {
      console.error('Upload Error:', error);
      return null;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    setAttachmentParams({
      type: isImage ? 'image' : 'file',
      url: previewUrl,
      name: file.name,
      size: bytes(file.size),
      fileObj: file
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAttachment = () => {
    if (attachmentParams?.url && attachmentParams.type === 'image') {
      URL.revokeObjectURL(attachmentParams.url);
    }
    setAttachmentParams(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) return;

    try {
      setLoading(true);

      let finalAttachmentType = null;
      let finalAttachmentData = null;

      if (attachmentParams?.fileObj) {
        const uploadResult = await uploadFileProcess(attachmentParams.fileObj);
        if (uploadResult) {
          finalAttachmentType = attachmentParams.type;
          finalAttachmentData = {
            url: uploadResult.publicUrl,
            name: attachmentParams.name,
            size: attachmentParams.size
          };
        }
      }

      const res = await fetchWithCsrf('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          attachmentType: finalAttachmentType,
          attachmentData: finalAttachmentData
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Ticket created successfully');
        onCreated?.(data.data);
        onClose();
        setFormData({ subject: '', category: 'general', description: '' });
        clearAttachment();
      } else {
        toast.error(data.error || 'Failed to create ticket');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 lg:p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
            <span className="p-2 bg-terracotta-50 rounded-full text-terracotta-500">
              <MdHelpOutline />
            </span>
            Create Support Ticket
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-navy-50 rounded-full text-navy-400 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-navy-700 mb-2">Subject</label>
            <input 
              autoFocus
              type="text" 
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief summary of your issue"
              className="w-full px-4 py-3 border border-navy-100 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 outline-none font-medium placeholder:text-navy-300 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-navy-700 mb-2">Category</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-navy-100 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 outline-none font-medium bg-white"
            >
              <option value="general">General Inquiry</option>
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing & Payments</option>
              <option value="safety">Safety & Trust</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-navy-700 mb-2">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us more about your issue in detail..."
              rows={4}
              className="w-full px-4 py-3 border border-navy-100 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 outline-none font-medium placeholder:text-navy-300 transition-all resize-none"
              required
            />
          </div>

          <div>
             <label className="block text-sm font-bold text-navy-700 mb-2">Attachment (Optional)</label>
             <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
             />
             
             <AnimatePresence>
                {attachmentParams ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl border border-navy-100"
                  >
                    {attachmentParams.type === 'image' && attachmentParams.url ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        <img src={attachmentParams.url} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-terracotta-500 shrink-0">
                        <MdDescription size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy-900 truncate">{attachmentParams.name}</p>
                      <p className="text-[10px] text-navy-400">{attachmentParams.size}</p>
                    </div>
                    <button type="button" onClick={clearAttachment} className="p-1.5 hover:bg-white rounded-full text-navy-400">
                      <MdClose size={18} />
                    </button>
                  </motion.div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-navy-100 rounded-xl flex flex-col items-center justify-center gap-1 text-navy-400 hover:border-terracotta-300 hover:text-terracotta-500 hover:bg-terracotta-50/30 transition-all group"
                  >
                    <MdAttachFile size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Add file or photo (max 5MB)</span>
                  </button>
                )}
             </AnimatePresence>
          </div>

          <div className="flex gap-3 pt-4">
             <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 font-bold text-navy-500 hover:bg-navy-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-navy-950 text-white font-bold py-3 rounded-xl hover:bg-navy-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            >
              {loading ? <GlobalSpinner size="sm" color="white" /> : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
