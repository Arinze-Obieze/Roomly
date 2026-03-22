'use client';

import { ListingCard } from "./ui/ListingCard";
import { motion } from 'framer-motion';
import { useMemo } from "react";

export default function PropertyGrid({ properties, loading, onSelect }) {
  const renderedProperties = useMemo(() => properties || [], [properties]);
  const skeletonItems = useMemo(() => Array.from({ length: 6 }), []);

  const isInitialLoad = loading && renderedProperties.length === 0;

  return (
    <>
      {/* Full-page skeletons — only on the very first load */}
      {isInitialLoad && (
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

      {/* Cards grid — stays mounted during load-more so cards don't flash away */}
      {!isInitialLoad && renderedProperties.length > 0 && (
        <motion.div
          key="card-grid"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="grid gap-8 auto-rows-fr"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
        >
          {renderedProperties.map((listing) => (
            <motion.div key={listing.id} layout>
              <ListingCard
                data={listing}
                onSelect={onSelect}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

    </>
  );
}
