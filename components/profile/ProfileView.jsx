'use client';

import { motion } from 'framer-motion';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { MdEmail, MdPhone, MdPerson, MdCalendarToday, MdCheckCircle } from 'react-icons/md';

export default function ProfileView() {
  const { user } = useAuthContext();

  if (!user) return null;

  const InfoItem = ({ icon: Icon, label, value }) => (
    <motion.div 
      whileHover={{ y: -2 }}
      className="flex items-start gap-4 p-4 rounded-xl bg-navy-50 border border-navy-200 transition-all hover:shadow-md hover:shadow-navy-950/5"
    >
      <div className="p-2 bg-white rounded-lg text-terracotta-600 shadow-sm border border-navy-100">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-heading font-medium text-navy-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-navy-950 font-heading font-medium">{value || 'Not set'}</p>
      </div>
    </motion.div>
  );

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
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="bg-white rounded-3xl border border-navy-200 p-6 shadow-xl shadow-navy-950/5"
    >
      <h2 className="text-xl font-heading font-bold text-navy-950 mb-6 flex items-center gap-2">
        Profile Details
        {user.profile_complete && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-teal-500"
          >
            <MdCheckCircle size={20} />
          </motion.span>
        )}
      </h2>

      <motion.div 
        variants={container}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        <motion.div variants={item}>
          <InfoItem icon={MdEmail} label="Email Address" value={user.email} />
        </motion.div>
        <motion.div variants={item}>
          <InfoItem icon={MdPerson} label="Full Name" value={user.full_name} />
        </motion.div>
        <motion.div variants={item}>
          <InfoItem icon={MdPhone} label="Phone Number" value={user.phone_number} />
        </motion.div>
        <motion.div variants={item}>
          <InfoItem 
            icon={MdCalendarToday} 
            label="Date of Birth" 
            value={user.date_of_birth && new Date(user.date_of_birth).toLocaleDateString()} 
          />
        </motion.div>
      </motion.div>

      <motion.div variants={item}>
        <h3 className="text-sm font-heading font-medium text-navy-500 uppercase tracking-wider mb-3">About Me</h3>
        <div className="p-6 bg-navy-50 rounded-xl border border-navy-200 text-navy-700 leading-relaxed font-sans">
          {user.bio ? (
            <p className="whitespace-pre-wrap">{user.bio}</p>
          ) : (
            <p className="text-navy-400 italic">No bio added yet.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}