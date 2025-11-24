export default function StickyCTA() {
  return (
    <div className="sticky bottom-0 z-10 w-full bg-white/80 p-4 backdrop-blur-md border-t border-gray-200 md:hidden">
      <button className="flex w-full items-center justify-center overflow-hidden rounded-full h-12 bg-cyan-500 text-white text-base font-bold hover:bg-cyan-400 transition-all duration-200 shadow-md">
        Get Started
      </button>
    </div>
  );
}
