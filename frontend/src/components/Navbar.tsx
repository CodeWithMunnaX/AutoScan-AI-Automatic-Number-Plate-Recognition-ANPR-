"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Scan, History, Shield, LogIn, LogOut, Car, UserPlus } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#040711]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">AutoScan</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
                Fleet Edition
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Enterprise Vehicle Intelligence</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname === "/"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "text-slate-300 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>Scanner</span>
          </Link>

          <Link
            href="/history"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname === "/history"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "text-slate-300 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Fleet History</span>
          </Link>

          {/* User Authentication */}
          <div className="ml-2 pl-2 border-l border-slate-800 flex items-center">
            {status === "authenticated" && session?.user ? (
              <div className="flex items-center gap-2.5">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full border border-emerald-500/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold shadow-sm">
                    {session.user.name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left text-xs leading-tight">
                  <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                    {session.user.name || "Operator"}
                  </span>
                  <span className="text-[10px] text-emerald-400">Authenticated</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin?mode=signin"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin?mode=signup"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
