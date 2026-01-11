export default function StickyCTA() {
  return (
    <div className="sticky bottom-0 z-sticky w-full bg-white/80 p-4 backdrop-blur-md border-t border-gray-200 md:hidden">
      <a 
        href="/signup"
        className="btn btn-primary w-full shadow-cyan-md hover:shadow-cyan-lg"
      >
        Get Started
      </a>
    </div>
  );
}
