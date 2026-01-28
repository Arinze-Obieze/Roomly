'use client';

import { usePropertiesWithFilters } from "@/hooks/usePropertiesWithFilters";
import { ListingCard } from "@/components/dashboard/ui/ListingCard";
import Link from "next/link";
import { MdArrowForward } from "react-icons/md";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

export default function FeaturedProperties() {
  const router = useRouter();
  const { properties, loading } = usePropertiesWithFilters({
    autoFetch: true,
    initialFilters: {
        pageSize: 4,
        verifiedOnly: true
    }
  });

  // Carousel Logic
  const carouselRef = useRef();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
        setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
  }, [properties, loading]);

  // Loading Skeleton
  if (loading) {
    return (
        <section className="py-12 md:py-20 bg-slate-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex justify-between items-end mb-10">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
                        <div className="h-5 w-96 bg-slate-200 rounded-lg animate-pulse"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-[350px] bg-white rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        </section>
    );
  }

  if (properties.length === 0) return null;

  return (
    <section className="py-12 md:py-20 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 md:mb-10 gap-4">
            <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                    Featured Rooms
                </h2>
                <p className="text-lg text-slate-500 font-medium">
                    Verified listings with high compatibility scores.
                </p>
            </div>
            
            <Link 
                href="/rooms"
                className="hidden md:flex items-center gap-2 font-bold text-slate-900 hover:text-cyan-600 transition-colors group"
            >
                View all properties
                <MdArrowForward className="group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>

        {/* Mobile Custom Carousel (Framer Motion) */}
        <div className="md:hidden -mx-4">
            <motion.div 
                ref={carouselRef} 
                className="cursor-grab active:cursor-grabbing overflow-hidden px-4"
                whileTap={{ cursor: "grabbing" }}
            >
                <motion.div 
                    drag="x" 
                    dragConstraints={{ right: 0, left: -width }}
                    className="flex gap-4"
                >
                    {properties.slice(0, 4).map(property => (
                        <motion.div 
                            key={property.id} 
                            className="min-w-[85vw] sm:min-w-[300px]"
                        >
                            <ListingCard 
                                data={property} 
                                onSelect={() => router.push(`/rooms/${property.id}`)}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
            
            {/* Visual Indication of Scroll - Simple Dots */}
            <div className="flex justify-center gap-2 mt-6">
                 {properties.slice(0, 4).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-slate-200"></div>
                 ))}
            </div>
            
            {/* Swipe Instruction */}
            <p className="text-center text-xs text-slate-400 mt-2 font-medium uppercase tracking-widest">
                Swipe to explore
            </p>
        </div>

        {/* Desktop Grid (Standard) */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.slice(0, 4).map(property => (
                <ListingCard 
                    key={property.id} 
                    data={property} 
                    onSelect={() => router.push(`/rooms/${property.id}`)}
                />
            ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-6 text-center md:hidden">
            <Link 
                href="/rooms"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-1 hover:text-cyan-600 hover:border-cyan-600 transition-colors"
            >
                View all properties <MdArrowForward />
            </Link>
        </div>

      </div>
    </section>
  );
}
