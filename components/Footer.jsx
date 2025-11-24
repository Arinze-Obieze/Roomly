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
    <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content - Stack on mobile, grid on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Section - Full width on mobile */}
          <div className="lg:col-span-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <img src="/logo.jpg" alt="Roomly" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-white">Roomly</span>
            </div>
            <p className="text-gray-300 text-sm mb-4 max-w-md md:max-w-none mx-auto md:mx-0">
              Intelligent matching for harmonious homes in Ireland.
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              {socialIcons.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-gray-800"
                  aria-label={`Follow us on ${social.icon.name}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links - Stack with Legal on mobile */}
          <div className="grid grid-cols-2 gap-8 md:block">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center md:text-left">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm block text-center md:text-left py-1"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal - Next to Quick Links on mobile */}
            <div className="md:hidden">
              <h3 className="text-lg font-semibold mb-4 text-center">Legal</h3>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex flex-col items-center md:flex-row md:items-start py-1"
                    >
                      {link.label}
                      {link.comingSoon && (
                        <span className="mt-1 md:mt-0 md:ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Legal - Hidden on mobile (shown above), visible on desktop */}
          <div className="hidden md:block">
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center"
                  >
                    {link.label}
                    {link.comingSoon && (
                      <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Full width on mobile */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-300 text-sm mb-2">Have questions?</p>
                <a
                  href="mailto:hello@roomly.ie"
                  className="text-primary hover:text-primary-light transition-colors duration-200 text-sm font-medium inline-block py-1"
                >
                  hello@roomly.ie
                </a>
              </div>
              <div className="pt-2">
                <p className="text-gray-400 text-xs max-w-xs mx-auto md:mx-0">
                  We're here to help you find your perfect flatmate match.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Stack on mobile */}
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <p className="text-gray-400 text-sm text-center sm:text-left order-2 sm:order-1">
            © {new Date().getFullYear()} Roomly. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm text-center sm:text-left order-1 sm:order-2">
            Making flatmate finding better in Ireland.
          </p>
        </div>
      </div>
    </footer>
  );
}