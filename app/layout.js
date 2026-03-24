import "./globals.css";
import { AuthProvider } from "@/core/contexts/AuthContext";
import GlobalToaster from "@/components/ui/GlobalToaster";

const inter = { variable: "--font-inter" };
const spaceGrotesk = { variable: "--font-space-grotesk" };

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://roomfind.ie'),
  title: {
    default: "RoomFind | Find Your Perfect Flatmate in Ireland",
    template: "%s | RoomFind"
  },
  description: "Discover the best rooms and flatmates across Ireland. RoomFind connects you with ideal roommates and properties.",
  keywords: ["roommate", "flatmate", "ireland", "rent", "room", "accommodation", "dublin", "housing"],
  authors: [{ name: "RoomFind" }],
  creator: "RoomFind",
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: "https://roomfind.ie", // Assumed production domain
    title: "RoomFind | Find Your Perfect Flatmate in Ireland",
    description: "Discover the best rooms and flatmates across Ireland. RoomFind connects you with ideal roommates and properties.",
    siteName: "RoomFind",
    images: [
      {
        url: "/logo/logo_with_bg.png",
        width: 1200,
        height: 630,
        alt: "RoomFind Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoomFind | Find Your Perfect Flatmate in Ireland",
    description: "Discover the best rooms and flatmates across Ireland. RoomFind connects you with ideal roommates and properties.",
    images: ["/logo/logo_with_bg.png"],
  },
  icons: {
    icon: [
      {
        url: '/logo/logo_with_bg.png',
        type: 'image/png',
        sizes: '32x32',
      },
    ],
    apple: [
      {
        url: '/logo/logo_with_bg.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import QueryProvider from '@/providers/QueryProvider';
import { ConfirmationProvider } from "@/core/contexts/ConfirmationContext";
import AdminReturnBadge from "@/components/ui/AdminReturnBadge";
import CookieConsent from "@/components/marketing/CookieConsent";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <QueryProvider>
          <ConfirmationProvider>
            <AuthProvider>
              <GlobalToaster/>
              {children}
              <AdminReturnBadge />
              <CookieConsent />
            </AuthProvider>
          </ConfirmationProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
