'use client';

import { usePropertiesWithFilters } from "@/hooks/usePropertiesWithFilters";
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

  // Loading Skeleton
  if (loading) {
    return (
        <section className="py-20 bg-slate-50">
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

  // If no properties, hide section or show something else? For marketing we should probably always have something, 
  // but if DB empty, we might just hide.
  if (properties.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.slice(0, 4).map(property => (
                <ListingCard 
                    key={property.id} 
                    data={property} 
                    onSelect={() => router.push(`/rooms/${property.id}`)}
                />
            ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
            <Link 
                href="/rooms"
                className="inline-flex items-center justify-center w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 hover:bg-slate-50 transition-colors"
            >
                View all 1,200+ rooms
            </Link>
        </div>

      </div>
    </section>
  );
}
