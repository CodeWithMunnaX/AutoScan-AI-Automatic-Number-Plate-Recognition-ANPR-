import type { Metadata } from "next";
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
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#040711] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {children}
          </main>
          <footer className="border-t border-slate-900/80 bg-slate-950/70 py-6 text-center text-xs text-slate-500 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>© 2026 AutoScan Fleet Intelligence. Precision License Plate Recognition & Automated Verification.</p>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Fleet Cloud Active
                </span>
                <span>•</span>
                <span>Neon PostgreSQL</span>
                <span>•</span>
                <span>Cloudinary HD</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
