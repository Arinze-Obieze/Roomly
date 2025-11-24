import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/contexts/supabase-provider";
import GlobalToaster from "@/components/GlobalToaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Roomly",
  description: "Find Your Perfect Flatmate in Ireland",
  icons: {
    icon: [
      {
        url: '/logo.jpg',
        sizes: 'any',
      },
      {
        url: '/logo.jpg',
        type: 'image/jpg',
        sizes: '32x32',
      },
    ],
    apple: [
      {
        url: '/logo.jpg',
        sizes: '180x180',
        type: 'image/jpg',
      },
    ],
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
            <SupabaseProvider>
<GlobalToaster/>
        {children}
              </SupabaseProvider>

      </body>
    </html>
  );
}
