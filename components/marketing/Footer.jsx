import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

export default function Footer() {
  const quickLinks = [
    { label: 'Find a Room', href: '/rooms' },
    { label: 'List a Room', href: '/listings/new' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Safety & Trust', href: '/trust' }
  ];

  const legalLinks = [
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' }
  ];

  const socialIcons = [
    { icon: FaFacebook, href: '#' },
    { icon: FaTwitter, href: '#' },
    { icon: FaInstagram, href: '#' }
  ];

  return (
    <footer className="bg-navy-950 text-white pt-16 pb-8 md:pt-24 md:pb-12 overflow-hidden relative border-t border-white/5 font-sans">
      
      {/* Background Watermark - Hidden on mobile */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none opacity-[0.03] hidden md:block">
        <span className="text-[12rem] md:text-[20rem] font-black tracking-tighter text-white leading-none whitespace-nowrap">
          ROOMLY
        </span>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-16 md:mb-20">
          
          {/* Brand Column - Full width on mobile */}
          <div className="space-y-6 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-bold tracking-tighter text-white">Roomly<span className="text-terracotta-500">.</span></span>
            </div>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md font-light">
              Making house sharing social, safe, and stress-free across Ireland.
            </p>
            <div className="flex gap-3 md:gap-4">
              {socialIcons.map((social, index) => (
                <a 
                  key={index} 
                  href={social.href} 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 transition-all duration-300 active:scale-95 touch-manipulation"
                  aria-label={`Follow us on ${social.icon.name.replace('Fa', '')}`}
                >
                  <social.icon size={18} className="md:w-5 md:h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="font-bold text-white mb-6 md:mb-8 text-xs md:text-sm uppercase tracking-widest">Platform</h5>
            <ul className="space-y-3 md:space-y-4">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-slate-400 hover:text-white transition-colors text-sm md:text-base font-light block py-1 md:py-0"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h5 className="font-bold text-white mb-6 md:mb-8 text-xs md:text-sm uppercase tracking-widest">Legal</h5>
            <ul className="space-y-3 md:space-y-4">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-slate-400 hover:text-white transition-colors text-sm md:text-base font-light block py-1 md:py-0"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h5 className="font-bold text-white mb-6 md:mb-8 text-xs md:text-sm uppercase tracking-widest">Support</h5>
            <div className="space-y-4">
              <p className="text-slate-400 text-sm md:text-base font-light">Got questions? We're here.</p>
              <a 
                href="mailto:hello@roomly.ie" 
                className="inline-block text-lg md:text-xl font-bold text-white hover:text-terracotta-400 transition-colors break-all"
              >
                hello@roomly.ie
              </a>
              <p className="text-slate-500 text-xs mt-2 md:mt-4">
                Available Mon–Fri, 9am–6pm
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar - Stack on mobile */}
        <div className="border-t border-white/5 pt-8 md:pt-12 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <p className="text-slate-500 text-xs md:text-sm font-light text-center md:text-left order-2 md:order-1">
            &copy; {new Date().getFullYear()} Roomly Technologies Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-2 order-1 md:order-2 mb-4 md:mb-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}