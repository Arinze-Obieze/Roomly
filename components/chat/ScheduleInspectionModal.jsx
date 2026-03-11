'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdEvent, MdAccessTime, MdChatBubbleOutline } from 'react-icons/md';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { toast } from 'react-hot-toast';

export const ScheduleInspectionModal = ({ isOpen, onClose, onSubmit }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get tomorrow's date for minimum selection
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!date || !time) {
            toast.error('Please select both a date and time.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ date, time, note });
            setDate('');
            setTime('');
            setNote('');
            onClose();
        } catch (error) {
            console.error('Submit inspection error:', error);
            // Error handling is managed by the parent
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-navy-950/40 z-50 backdrop-blur-sm"
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 w-full md:w-[450px] bg-white md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-navy-100 bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-heading font-bold text-navy-950">Schedule Inspection</h2>
                                <p className="text-sm font-sans text-navy-500 mt-1">Propose a time to view the property</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-navy-50 text-navy-500 hover:bg-navy-100 transition-colors"
                            >
                                <MdClose size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-6 overflow-y-auto">
                            <form id="schedule-form" onSubmit={handleSubmit} className="space-y-6">
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-heading font-bold text-navy-900 block">Date</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">
                                                <MdEvent size={20} />
                                            </div>
                                            <input 
                                                type="date"
                                                min={minDate}
                                                required
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm font-sans focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-colors appearance-none"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-heading font-bold text-navy-900 block">Time</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">
                                                <MdAccessTime size={20} />
                                            </div>
                                            <input 
                                                type="time"
                                                required
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm font-sans focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-colors appearance-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-heading font-bold text-navy-900 block">
                                        Message <span className="text-navy-400 font-normal">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-navy-400">
                                            <MdChatBubbleOutline size={20} />
                                        </div>
                                        <textarea 
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="E.g., Does this time work for you?"
                                            rows={3}
                                            className="w-full pl-10 pr-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm font-sans focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-colors resize-none placeholder-navy-400"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-navy-100 bg-white sticky bottom-0 z-10">
                            <button
                                type="submit"
                                form="schedule-form"
                                disabled={isSubmitting || !date || !time}
                                className="w-full py-3.5 bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 text-white rounded-xl font-heading font-bold text-[15px] shadow-lg shadow-terracotta-500/25 transition-all text-center flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <GlobalSpinner size="sm" color="white" /> : 'Request Inspection'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
