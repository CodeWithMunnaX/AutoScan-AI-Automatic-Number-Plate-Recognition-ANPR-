"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Scan, History, LogOut, Car, UserPlus } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
      active
        ? "bg-pink-50 text-pink-600 border border-pink-200"
        : "text-slate-600 border border-transparent hover:text-pink-600 hover:bg-pink-50"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-pink-100 bg-white/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-200 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-800 tracking-tight">AutoScan</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 font-semibold border border-pink-200">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">License Plate Recognition</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/" className={navLinkClass(pathname === "/")}>
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Scanner</span>
          </Link>

          <Link href="/history" className={navLinkClass(pathname === "/history")}>
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </Link>

          {/* User Authentication */}
          <div className="ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-pink-100 flex items-center">
            {status === "authenticated" && session?.user ? (
              <div className="flex items-center gap-2.5">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full border-2 border-pink-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {session.user.name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left text-xs leading-tight">
                  <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                    {session.user.name || "Operator"}
                  </span>
                  <span className="text-[10px] text-pink-500">Signed in</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin?mode=signin"
                  className="px-3 py-1.5 text-xs font-semibold text-pink-600 bg-white hover:bg-pink-50 rounded-xl border border-pink-200 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signin?mode=signup"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-sm shadow-pink-200 transition-colors active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
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
