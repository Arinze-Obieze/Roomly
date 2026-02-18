"use client"
import { motion } from 'framer-motion';
import CommunityFeed from '@/components/community/CommunityFeed';

export default function CommunityPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-navy-50 pb-20 pt-8 px-4 lg:px-8"
    >
      <CommunityFeed />
    </motion.div>
  );
}