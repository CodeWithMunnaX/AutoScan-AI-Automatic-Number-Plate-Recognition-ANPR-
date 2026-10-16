import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "AutoScan AI - Precision Vehicle License Plate Scanner",
  description:
    "Enterprise-grade Automatic Number Plate Recognition (ANPR) with real-time detection, high-accuracy transcription, and secure cloud fleet logging.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fff7fa] text-slate-600 antialiased selection:bg-pink-200 selection:text-pink-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {children}
          </main>
          <footer className="border-t border-pink-100 bg-white/80 py-6 text-xs text-slate-500 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <p className="text-slate-600">
                © 2026 AutoScan AI · Built by{" "}
                <span className="font-semibold text-pink-600">CodeWithMunnaX</span>
              </p>
              <nav className="flex items-center gap-4">
                <Link href="/how-it-works" className="hover:text-pink-600">How it works</Link>
                <Link href="/api-docs" className="hover:text-pink-600">API</Link>
                <Link href="/about" className="hover:text-pink-600">About</Link>
                <a href="https://github.com/CodeWithMunnaX" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600">
                  GitHub
                </a>
              </nav>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
