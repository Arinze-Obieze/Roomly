import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

export default function Footer() {
  const quickLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQs', href: '#faqs' }
  ];

  const legalLinks = [
    { label: 'Terms of Service', href: '#', comingSoon: false },
    { label: 'Privacy Policy', href: '#', comingSoon: false }
  ];

  const socialIcons = [
    { icon: FaFacebook, href: '#' },
    { icon: FaTwitter, href: '#' },
    { icon: FaInstagram, href: '#' }
  ];

  return (
    <footer className="bg-slate-950 text-white pt-24 pb-12 overflow-hidden relative border-t border-white/5">
      
      {/* 1. Massive Watermark (The "Design" Touch) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none opacity-[0.02]">
        <span className="text-[12rem] md:text-[20rem] font-black tracking-tighter text-white leading-none whitespace-nowrap">
          ROOMLY
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              {/* If you have a logo image, use it, otherwise use text */}
              <span className="text-2xl font-bold tracking-tight text-white">Roomly.</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Intelligent matching for harmonious homes in Ireland. Built in Dublin, designed for trust.
            </p>
            <div className="flex gap-4">
              {socialIcons.map((social, index) => (
                <a 
                  key={index} 
                  href={social.href} 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-slate-900 hover:border-cyan-400 transition-all duration-300"
                  aria-label="Social Link"
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="font-bold text-white mb-6 tracking-wide">Platform</h5>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h5 className="font-bold text-white mb-6 tracking-wide">Legal</h5>
            <ul className="space-y-4">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="group flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium">
                    {link.label}
                    {link.comingSoon && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-cyan-400 border border-cyan-900/50">
                        Soon
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h5 className="font-bold text-white mb-6 tracking-wide">Support</h5>
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Need help matching?</p>
              <a 
                href="mailto:hello@roomly.ie" 
                className="inline-block text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 hover:opacity-80 transition-opacity"
              >
                hello@roomly.ie
              </a>
              <p className="text-slate-500 text-xs">
                Response time: Within 24 hours.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
          <p>&copy; {new Date().getFullYear()} Roomly Technologies Ltd.</p>
          <div className="flex items-center gap-6">
          </div>
        </div>
      </div>
    </footer>
  );
}