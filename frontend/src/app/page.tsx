"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import Dropzone from "@/components/Dropzone";
import ResultCard from "@/components/ResultCard";
import { DetectionResult } from "@/types";
import { detectPlate } from "@/lib/api";
import {
  Car,
  Sparkles,
  Lock,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  UserPlus,
  Layers,
  Database,
  Search,
  Check,
} from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = status === "authenticated" && !!session;

  const handleDetect = async () => {
    if (!isAuthenticated) {
      setError("Authentication Required: Please sign in before scanning vehicle license plates.");
      return;
    }

    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await detectPlate(selectedFile);
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || "Could not detect a license plate in this image.");
      }
    } catch (err: any) {
      console.error("Detection error:", err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to connect to backend scanner service. Ensure server is running on http://localhost:8000.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to load sample test images for instant demonstration
  const handleLoadSample = async (sampleUrl: string, sampleName: string) => {
    if (!isAuthenticated) {
      setError("Authentication Required: Please sign in before testing sample vehicle images.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const file = new File([blob], sampleName, { type: blob.type || "image/jpeg" });
      setSelectedFile(file);
      setResult(null);
    } catch (err) {
      console.error("Failed to load sample:", err);
      setError("Failed to fetch sample image.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Intelligent Vehicle Vision Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Automatic Number Plate Recognition{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            (ANPR)
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          High-accuracy vehicle license plate recognition. Instant sub-second localization,
          precision alphanumeric transcription, regional format verification, and secure cloud fleet logs.
        </p>

        {/* Feature Highlights Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300">
            <Car className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant Plate Detection</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Commercial & Private Plates</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Format & Regional Verification</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Fleet History</span>
          </div>
        </div>
      </section>

      {/* Main Scanner Section with Authentication Gate */}
      <section className="max-w-3xl mx-auto">
        {status === "loading" ? (
          /* Loading State */
          <div className="p-12 rounded-3xl bg-slate-900/50 border border-slate-800 text-center animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto mb-3" />
            <div className="h-4 bg-slate-800 rounded w-48 mx-auto mb-2" />
            <div className="h-3 bg-slate-800/60 rounded w-64 mx-auto" />
          </div>
        ) : !isAuthenticated ? (
          /* LOCKED: Authentication Gate Card */
          <div className="relative rounded-3xl bg-slate-900/85 border border-slate-800 p-8 sm:p-12 text-center overflow-hidden shadow-2xl backdrop-blur-xl">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                <Lock className="w-8 h-8" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                Authentication Required to Scan Vehicles
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                To prevent unauthorized batch queries and protect vehicle data, photo uploading and camera scanning are strictly reserved for signed-in operators.
              </p>

              {/* Instant Auth Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    signIn("credentials", {
                      callbackUrl: "/",
                      email: "inspector@autoscan.ai",
                      password: "demo",
                    })
                  }
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group active:scale-95"
                >
                  <Zap className="w-4 h-4 text-slate-950 fill-current" />
                  <span>1-Click Quick Access</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <Link
                  href="/auth/signin?mode=signin"
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700/80 transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/auth/signin?mode=signup"
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-bold rounded-xl border border-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Sign Up</span>
                </Link>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected Fleet Scanner Portal</span>
              </div>
            </div>
          </div>
        ) : (
          /* UNLOCKED: Active Session & Dropzone */
          <div className="space-y-4">
            {/* Authenticated Operator Status Bar */}
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">
                  Authorized Session: {session.user?.name || session.user?.email || "Fleet Operator"}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400/80">
                Upload & Camera Permissions Active
              </span>
            </div>

            <Dropzone
              selectedFile={selectedFile}
              onFileSelect={(file) => {
                setSelectedFile(file);
                setResult(null);
                setError(null);
              }}
              onDetect={handleDetect}
              isLoading={isLoading}
            />

            {/* Sample Images Quick Test Bar */}
            {!selectedFile && (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs backdrop-blur-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>Don't have a vehicle photo handy? Try a sample:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleLoadSample(
                        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
                        "sample_car_license_plate_1.jpg"
                      )
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-700 transition-colors"
                  >
                    Sample Vehicle 1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleLoadSample(
                        "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80",
                        "sample_car_license_plate_2.jpg"
                      )
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-700 transition-colors"
                  >
                    Sample Vehicle 2
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Error Alert */}
      {error && (
        <section className="max-w-3xl mx-auto animate-fadeIn">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">Notice</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        </section>
      )}

      {/* Result Display Section */}
      {result && (
        <section className="max-w-3xl mx-auto">
          <ResultCard
            result={result}
            onPlateUpdated={(newPlate) => {
              setResult({ ...result, plate_number: newPlate });
            }}
          />
        </section>
      )}

      {/* Enterprise Platform Features (Replacing technical pipeline) */}
      <section className="max-w-4xl mx-auto pt-8 border-t border-slate-900">
        <h3 className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">
          Enterprise Fleet Recognition Capabilities
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-3 border border-emerald-500/20">
              <Car className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Instant Localization</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects vehicle boundary and plate region on bumpers in milliseconds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold mb-3 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">High-Precision OCR</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-accuracy alphanumeric extraction optimized across varied lighting and angles.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold mb-3 border border-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Regional Analysis</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Validates jurisdiction standards, EV plates, commercial badges, and format structure.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-3 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Cloud Fleet Log</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant encrypted synchronization with high-resolution image archive and database records.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
