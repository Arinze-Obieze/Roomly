'use client';

import { MdOutlineFeedback, MdSend } from 'react-icons/md';

export default function FeedbackPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-navy-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
            <MdOutlineFeedback size={22} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-navy-950">Give Feedback</h1>
        </div>
        <p className="text-sm text-navy-600 mb-4">
          This is the right place in dev for bug reports, UX issues, and feature ideas.
        </p>
        <a
          href="mailto:support@roomfind.ie?subject=RoomFind%20Feedback"
          className="inline-flex items-center gap-2 bg-terracotta-500 text-white px-4 py-2.5 rounded-xl font-heading font-bold hover:bg-terracotta-600 transition-colors"
        >
          <MdSend size={16} />
          Send Feedback
        </a>
      </div>
    </main>
  );
}
