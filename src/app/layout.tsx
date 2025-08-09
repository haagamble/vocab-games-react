import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WordListProvider } from "./WordListContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tajik Vocab Games",
  description: "A collection of activities to help you learn Tajik vocabulary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Wrap all pages with word list context */}
        <WordListProvider>
          {children}
        </WordListProvider>
        
        {/* Footer appears on every page */}
        <footer className="flex gap-[24px] flex-wrap items-center justify-center p-4">
          
        </footer>
      </body>
    </html>
  );
}