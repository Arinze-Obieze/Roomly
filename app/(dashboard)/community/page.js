"use client"
import { motion } from 'framer-motion';
import CommunityFeed from '@/components/community/CommunityFeed';
import { MdGroups, MdForum, MdTipsAndUpdates } from 'react-icons/md';

export default function CommunityPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-navy-50 pb-20 pt-8 px-4 lg:px-8"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
        <aside className="hidden xl:block xl:col-span-3">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-navy-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MdGroups className="text-terracotta-500" size={20} />
                <h2 className="font-heading font-bold text-navy-950">Community</h2>
              </div>
              <p className="text-sm text-navy-600">Share updates, ask questions, and help people find safe homes.</p>
            </div>
            <div className="bg-white rounded-3xl border border-navy-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MdTipsAndUpdates className="text-terracotta-500" size={18} />
                <h3 className="font-heading font-bold text-navy-900">Posting Tips</h3>
              </div>
              <ul className="text-sm text-navy-600 space-y-2">
                <li>Use clear location details.</li>
                <li>Share practical advice only.</li>
                <li>Report suspicious activity quickly.</li>
              </ul>
            </div>
          </div>
        </aside>

        <section className="xl:col-span-6">
          <CommunityFeed />
        </section>

        <aside className="hidden xl:block xl:col-span-3">
          <div className="sticky top-24 bg-white rounded-3xl border border-navy-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MdForum className="text-terracotta-500" size={18} />
              <h3 className="font-heading font-bold text-navy-900">Keep It Helpful</h3>
            </div>
            <p className="text-sm text-navy-600 leading-relaxed">
              Be respectful and specific. Community posts are most useful when they include city, timing, and clear details.
            </p>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
