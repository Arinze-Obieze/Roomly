'use client';

export default function CarouselProgress({ total, current, className = "" }) {
  if (total <= 1) return null;

  return (
    <div className={`flex justify-center gap-2 mt-6 md:hidden ${className}`}>
      {[...Array(total)].map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === current ? "w-6 bg-terracotta-500" : "w-2 bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}
