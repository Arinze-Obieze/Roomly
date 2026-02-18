import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/core/contexts/AuthContext";
import GlobalToaster from "@/components/ui/GlobalToaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata = {
  title: "RoomFind",
  description: "Find Your Perfect Flatmate in Ireland",
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

// ... existing imports

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <GlobalToaster/>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}


