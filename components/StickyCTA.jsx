export default function StickyCTA() {
  return (
    <div className="sticky bottom-0 z-10 w-full bg-card/80 p-4 backdrop-blur-sm border-t border-border md:hidden">
      <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 bg-primary text-white text-base font-bold hover:opacity-90 transition-opacity duration-200">
        Get Started
      </button>
    </div>
  );
}