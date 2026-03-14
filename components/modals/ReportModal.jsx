"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose, MdFlag, MdWarningAmber } from "react-icons/md";
import { toast } from "sonner";
import { fetchWithCsrf } from "@/core/utils/fetchWithCsrf";
import GlobalSpinner from "@/components/ui/GlobalSpinner";

const PRESET_REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Inappropriate content",
  "Scam or fraud",
  "Fake profile / Impersonation",
];

export default function ReportModal({ isOpen, onClose, itemType, itemId, itemTitle }) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason.trim() : reason;

    if (!finalReason || finalReason.length < 5) {
      toast.error("Please provide a valid reason for reporting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchWithCsrf("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_item_type: itemType,
          reported_item_id: itemId,
          reason: finalReason,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to submit report");
      }

      toast.success("Report submitted successfully. Our team will review it shortly.");
      onClose();
    } catch (error) {
      console.error("Report submission failed:", error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch(itemType) {
      case 'property': return 'Report Listing';
      case 'user': return 'Report User';
      case 'post': return 'Report Community Post';
      default: return 'Report Content';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <MdFlag size={20} />
              </div>
              <h2 className="text-xl font-bold font-spaceGrotesk text-slate-900">
                {getTitle()}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto">
            {itemTitle && (
              <div className="flex items-start gap-3 p-3 mb-6 bg-slate-50 rounded-xl border border-slate-200">
                 <MdWarningAmber className="text-amber-500 shrink-0 mt-0.5" size={18} />
                 <p className="text-sm font-medium text-slate-700 leading-snug">
                   You are reporting <span className="font-bold">{itemTitle}</span>. This alert will be sent directly to the moderation team.
                 </p>
              </div>
            )}

            <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Why are you reporting this?
                </label>
                
                <div className="space-y-2">
                  {PRESET_REASONS.map((r) => (
                    <label 
                      key={r} 
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        reason === r ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r}
                        checked={reason === r}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-4 h-4 text-primary focus:ring-primary border-slate-300 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700">{r}</span>
                    </label>
                  ))}
                  
                  <label 
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      reason === "Other" ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value="Other"
                      checked={reason === "Other"}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700">Other reason...</span>
                  </label>
                </div>
              </div>

              {reason === "Other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-2"
                >
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Please provide details
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe the issue specifically..."
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-h-[100px] resize-none"
                    required={reason === "Other"}
                  />
                </motion.div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 mt-auto bg-white border-t border-slate-100">
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="report-form"
                disabled={isSubmitting || !reason || (reason === "Other" && customReason.trim().length < 5)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:bg-rose-400 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
              >
                {isSubmitting ? (
                  <>
                    <GlobalSpinner size="sm" color="white" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-400 mt-4">
              False reporting may result in account suspension.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
