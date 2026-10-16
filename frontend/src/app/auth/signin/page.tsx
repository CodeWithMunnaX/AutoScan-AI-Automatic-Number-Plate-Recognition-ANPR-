"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScanLine, User, Mail, KeyRound, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { signupUser } from "@/lib/api";

type Mode = "signin" | "signup";

function getErrorMessage(err: any): string {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg.replace(/^Value error, /, "");
  if (err?.code === "ECONNABORTED" || !err?.response) {
    return "Server is waking up. Please try again in a few seconds.";
  }
  return "Something went wrong. Please try again.";
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.push("/");
  }, [status, router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    router.replace(`/auth/signin${next === "signup" ? "?mode=signup" : ""}`);
  };

  const loginWithCredentials = async () => {
    const res = await signIn("credentials", { redirect: false, email: email.trim(), password });
    if (res?.error) {
      setError("Invalid email or password.");
      return false;
    }
    router.push("/");
    router.refresh();
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (name.trim().length < 2) return setError("Please enter your full name.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
    }

    setIsLoading(true);
    try {
      if (mode === "signup") {
        await signupUser(name.trim(), email.trim(), password);
      }
      await loginWithCredentials();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-500 text-white shadow-lg shadow-pink-200 mb-4">
            <ScanLine className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSignup ? "Sign up to start scanning number plates" : "Sign in to continue to AutoScan AI"}
          </p>
        </div>

        <div className="bg-white border border-pink-100 rounded-2xl shadow-sm shadow-pink-100/50 p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-1 p-1 mb-6 bg-pink-50 rounded-xl">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === m ? "bg-white text-pink-600 shadow-sm" : "text-slate-500 hover:text-pink-600"
                }`}
              >
                {m === "signin" ? "Login" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <Field label="Full name" icon={<User className="w-4 h-4" />}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Munna Kumar"
                  autoComplete="name"
                  required
                  className="input pl-10"
                />
              </Field>
            )}

            <Field label="Email" icon={<Mail className="w-4 h-4" />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="input pl-10"
              />
            </Field>

            <Field label="Password" icon={<KeyRound className="w-4 h-4" />}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 6 characters" : "Your password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            {error && (
              <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-white bg-pink-500 rounded-xl hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md shadow-pink-200"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignup ? "Create account" : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isSignup ? "Already have an account? " : "New to AutoScan AI? "}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? "signin" : "signup")}
              className="font-semibold text-pink-600 hover:text-pink-700"
            >
              {isSignup ? "Login" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none">{icon}</span>
        {children}
      </div>
    </label>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh]" />}>
      <SignInContent />
    </Suspense>
  );
}
