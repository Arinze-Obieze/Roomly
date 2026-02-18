'use client';

import { usePropertiesWithFilters } from "@/core/hooks/usePropertiesWithFilters";
import { ListingCard } from "@/components/dashboard/ui/ListingCard";
import Link from "next/link";
import { MdArrowForward } from "react-icons/md";
import { useRouter } from "next/navigation";

export default function FeaturedProperties() {
  const router = useRouter();
  const { properties, loading } = usePropertiesWithFilters({
    autoFetch: true,
    initialFilters: {
        pageSize: 4,
        verifiedOnly: true
    }
  });

  if (loading) {
    return (
        <section className="py-16 md:py-24 bg-slate-50">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-[400px] bg-white rounded-[2rem] animate-pulse"></div>
                    ))}
                </div>
            </div>
        </section>
    );
  }

  if (properties.length === 0) return null;

  return (
    <section className="py-16 md:py-32 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Header: Focused Signal */}
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 md:mb-16 gap-6">
            <div className="max-w-xl text-center md:text-left mx-auto md:mx-0">
                <h2 className="text-3xl md:text-5xl font-sans font-extrabold text-navy-950 mb-4 tracking-tight">
                    Featured Homes
                </h2>
                <p className="text-lg text-slate-500 font-light leading-relaxed">
                    Hand-picked, verified listings with high compatibility. <br className="hidden md:block" />
                    <span className="inline-flex items-center gap-1 text-terracotta-500 font-medium justify-center md:justify-start">Log in to see your match scores.</span>
                </p>
            </div>
            
            <Link 
                href="/rooms"
                className="hidden md:inline-flex items-center gap-2 font-bold text-navy-950 hover:text-terracotta-500 transition-colors group text-sm uppercase tracking-widest mb-2"
            >
                Explore all rooms
                <MdArrowForward className="group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>

        {/* Mobile Carousel - Native CSS Snap Scrolling */}
        <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-6 px-4 -mx-4">
                {properties.slice(0, 4).map(property => (
                    <div 
                        key={property.id} 
                        className="min-w-[85vw] snap-center"
                    >
                        <ListingCard 
                            data={property} 
                            onSelect={() => router.push(`/rooms/${property.id}`)}
                        />
                    </div>
                ))}
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-4">
                 {properties.slice(0, 4).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                 ))}
            </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {properties.slice(0, 4).map(property => (
                <ListingCard 
                    key={property.id} 
                    data={property} 
                    onSelect={() => router.push(`/rooms/${property.id}`)}
                />
            ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-12 text-center md:hidden">
            <Link 
                href="/rooms"
                className="bg-navy-950 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mx-auto w-fit shadow-xl"
            >
                View all properties <MdArrowForward />
            </Link>
        </div>

      </div>
    </section>
  );
}
