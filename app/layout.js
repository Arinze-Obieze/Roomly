import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
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


