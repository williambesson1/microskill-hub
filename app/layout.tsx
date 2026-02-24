import type { Metadata } from "next";
import { Karla, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Import your new Footer component
import Footer from "../components/Footer"; 

// Replace Geist with Karla for your main text
const karla = Karla({
  variable: "--font-sans",
  subsets: ["latin"],
  display: 'swap',
});

// Keep Geist Mono for your monospace elements
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
    <html lang="en" className={`${karla.variable} ${geistMono.variable}`} suppressHydrationWarning> 
      <body
        className={`font-sans antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {/* The flex-grow on a wrapper ensures the footer stays at the 
          bottom even on pages with very little content.
        */}
        <div className="flex-grow flex flex-col">
          {children}
        </div>

        {/* 3. The Footer sits at the very bottom of every page */}
        <Footer />
      </body>
    </html>
  );
}