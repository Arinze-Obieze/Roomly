'use client';

import { ListingCard } from "./ui/ListingCard";
import { motion } from 'framer-motion';
import { useMemo } from "react";

export default function PropertyGrid({ properties, loading, onSelect }) {
  const renderedProperties = useMemo(() => properties || [], [properties]);
  const skeletonItems = useMemo(() => Array.from({ length: 6 }), []);

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
      {!loading && renderedProperties.length > 0 && (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-8 auto-rows-fr"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
        >
          {renderedProperties.map((listing) => (
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
        <div 
          className="grid gap-8"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
        >
          {skeletonItems.map((_, i) => (
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
