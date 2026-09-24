import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "30cent - AI Personal Finance",
  description: "Personal finance app with AI features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-[#171717] text-[#ececec] font-sans">
        <AuthGuard>
          <Sidebar />

          <main className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-[#171717]">
            {children}
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}