import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Import your new Footer component
import Footer from "../components/Footer"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Updated Metadata for a professional feel
export const metadata: Metadata = {
  title: "Paradise Hub | Master Your Microskills",
  description: "Your personal island command center for growth and mastery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {/* The flex-grow on a wrapper ensures the footer stays at the 
          bottom even on pages with very little content.
        */}
        <div className="flex-grow">
          {children}
        </div>

        {/* 3. The Footer sits at the very bottom of every page */}
        <Footer />
      </body>
    </html>
  );
}