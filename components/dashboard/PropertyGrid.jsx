'use client';

import { ListingCard } from "./ui/ListingCard";
import { motion } from 'framer-motion';

export default function PropertyGrid({ properties, loading, onSelect }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <>
      {!loading && properties.length > 0 && (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-fr"
        >
          {properties.map((listing) => (
            <motion.div key={listing.id} variants={item}>
              <ListingCard 
                data={listing}
                onSelect={() => onSelect(listing.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-navy-200 overflow-hidden h-[420px] animate-pulse">
              <div className="h-48 bg-navy-100" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-navy-100 rounded-lg w-3/4" />
                <div className="h-4 bg-navy-100 rounded-lg w-1/2" />
                <div className="flex gap-2 mt-2">
                  <div className="h-6 bg-navy-100 rounded-full w-16" />
                  <div className="h-6 bg-navy-100 rounded-full w-16" />
                </div>
                <div className="h-10 bg-navy-100 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}