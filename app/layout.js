import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalToaster from "@/components/ui/GlobalToaster";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
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
        className={`${plusJakartaSans.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <GlobalToaster/>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}


