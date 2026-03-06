'use client';

import { motion } from 'framer-motion';
import { MdPeople, MdChat, MdArrowForward, MdAdd } from 'react-icons/md';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function BuddyGroupList({ groups, onSelect, onCreateNew }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-navy-950">Your Buddy Groups</h1>
          <p className="text-navy-500 mt-1">Manage your flatmate search groups</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreateNew}
          className="bg-navy-950 text-white px-5 py-2.5 rounded-xl font-heading font-bold flex items-center gap-2 hover:bg-navy-900 transition-all shadow-lg active:scale-95"
        >
          <MdAdd size={20} />
          <span className="hidden sm:inline">New Group</span>
        </motion.button>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {groups.map((g) => (
          <motion.div
            key={g.id}
            variants={item}
            onClick={() => onSelect(g.id)}
            className="group bg-white rounded-[2.5rem] border border-navy-100 p-6 shadow-sm hover:shadow-xl hover:shadow-navy-900/5 transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-terracotta-500/10 transition-colors"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-terracotta-50 flex items-center justify-center text-terracotta-600 shadow-sm border border-terracotta-100">
                  <MdPeople size={24} />
                </div>
                <div className="flex -space-x-2">
                    {/* We could pass top 3 member avatars here if we fetch them, 
                        but for now let's just show a simple badge */}
                    <span className="bg-navy-50 text-navy-600 text-[10px] font-heading font-bold px-2.5 py-1 rounded-full border border-navy-100 uppercase tracking-wider">
                        Active
                    </span>
                </div>
              </div>

              <h3 className="text-xl font-heading font-bold text-navy-950 mb-1 group-hover:text-terracotta-600 transition-colors">
                {g.name}
              </h3>
              
              <div className="flex items-center gap-4 text-xs text-navy-500 font-sans mb-6">
                <div className="flex items-center gap-1">
                  <MdPeople className="text-navy-400" size={14} />
                  <span>{g.member_count || '...'} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <MdChat className="text-navy-400" size={14} />
                  <span>Created {dayjs(g.created_at).fromNow()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-navy-50">
                <span className="text-xs font-heading font-bold text-navy-400 group-hover:text-terracotta-600 transition-colors">
                  Open Dashboard
                </span>
                <div className="w-8 h-8 rounded-full bg-navy-50 flex items-center justify-center text-navy-400 group-hover:bg-terracotta-500 group-hover:text-white transition-all shadow-sm">
                  <MdArrowForward size={18} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
