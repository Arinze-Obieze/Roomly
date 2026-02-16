'use client';

import { useState } from 'react';
import { MdClose, MdSend, MdVerified } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const ICEBREAKERS = [
  "👋 I'm a young professional",
  "🎓 I'm a student",
  "🚭 Non-smoker",
  "🐱 I have a pet",
  "✨ Very clean & tidy",
  "🍳 Love to cook",
  "🤫 Quiet & respectful",
  "🏃‍♂️ Active lifestyle"
];

export default function ContactHostModal({ isOpen, onClose, host, propertyTitle, onSend }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleIcebreakerClick = (chip) => {
    setMessage(prev => {
        // If empty, just set it
        if (!prev) return `Hi ${host.name}, ${chip.replace('👋 ', '')}...`;
        // If not empty, append
        return `${prev} ${chip}`;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
        toast.error('Please write a message');
        return;
    }
    
    setLoading(true);
    try {
        await onSend(message);
        setMessage('');
        onClose();
    } catch (error) {
        console.error(error);
        toast.error('Failed to send message');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-navy-50 flex items-center justify-between bg-navy-50/50">
            <h3 className="font-heading font-bold text-lg text-navy-950">
                Contact Host
            </h3>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-navy-100 rounded-full text-navy-400 transition-colors"
            >
                <MdClose size={20} />
            </button>
        </div>

        <div className="p-6">
            {/* Host Context */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                    {host.avatar ? (
                        <img src={host.avatar} alt={host.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-terracotta-100 text-terracotta-700 flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm">
                             {host.name?.charAt(0)}
                        </div>
                    )}
                    {host.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <MdVerified className="text-teal-500 text-base" />
                        </div>
                    )}
                </div>
                <div>
                    <div className="text-sm text-slate-500 mb-0.5">Send a message to</div>
                    <div className="font-bold text-navy-950 text-lg leading-none">{host.name}</div>
                    <div className="text-xs text-slate-400 mt-1">regarding <span className="font-medium text-navy-700">{propertyTitle}</span></div>
                </div>
            </div>

            {/* Icebreakers */}
            <div className="mb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Introductions
                </div>
                <div className="flex flex-wrap gap-2">
                    {ICEBREAKERS.map((chip) => (
                        <button
                            key={chip}
                            type="button"
                            onClick={() => handleIcebreakerClick(chip)}
                            className="text-xs font-medium px-3 py-1.5 bg-navy-50 text-navy-700 rounded-full hover:bg-navy-100 hover:text-navy-900 transition-colors border border-navy-100 active:scale-95"
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message Form */}
            <form onSubmit={handleSubmit}>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Hi ${host.name}, I'm interested in the room...`}
                    className="w-full h-32 px-4 py-3 rounded-xl border border-navy-100 bg-white text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 resize-none text-sm leading-relaxed mb-4"
                    autoFocus
                />
                
                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-terracotta-500/20 transition-all active:scale-95 text-sm"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Send Message</span>
                                <MdSend />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
