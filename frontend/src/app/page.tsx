"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Dropzone from "@/components/Dropzone";
import ResultCard from "@/components/ResultCard";
import { DetectionResult } from "@/types";
import { detectPlate } from "@/lib/api";
import {
  Car,
  Sparkles,
  Lock,
  ShieldCheck,
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
        "Failed to connect to the scanner service. The server may be waking up — please try again in a minute.";
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          <span>Intelligent Vehicle Vision Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-800 leading-tight">
          Automatic Number Plate Recognition{" "}
          <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
            (ANPR)
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          High-accuracy vehicle license plate recognition. Instant sub-second localization,
          precision alphanumeric transcription, regional format verification, and secure cloud fleet logs.
        </p>

        {/* Feature Highlights Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-pink-100 rounded-xl text-xs text-slate-600 shadow-sm shadow-pink-100/50">
            <Car className="w-3.5 h-3.5 text-pink-500" />
            <span>Instant Plate Detection</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-pink-100 rounded-xl text-xs text-slate-600 shadow-sm shadow-pink-100/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-pink-500" />
            <span>Commercial & Private Plates</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-pink-100 rounded-xl text-xs text-slate-600 shadow-sm shadow-pink-100/50">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-500" />
            <span>Format & Regional Verification</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-pink-100 rounded-xl text-xs text-slate-600 shadow-sm shadow-pink-100/50">
            <Database className="w-3.5 h-3.5 text-pink-500" />
            <span>Encrypted Fleet History</span>
          </div>
        </div>
      </section>

      {/* Main Scanner Section with Authentication Gate */}
      <section className="max-w-3xl mx-auto">
        {status === "loading" ? (
          /* Loading State */
          <div className="p-12 card text-center animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 mx-auto mb-3" />
            <div className="h-4 bg-pink-100 rounded w-48 mx-auto mb-2" />
            <div className="h-3 bg-pink-50 rounded w-64 mx-auto" />
          </div>
        ) : !isAuthenticated ? (
          /* LOCKED: Authentication Gate Card */
          <div className="relative card card-glow p-6 sm:p-12 text-center overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-pink-100/70 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-rose-100/70 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-500 mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 tracking-tight">
                Authentication Required to Scan Vehicles
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                To prevent unauthorized batch queries and protect vehicle data, photo uploading and camera scanning are strictly reserved for signed-in operators.
              </p>

              {/* Instant Auth Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth/signin?mode=signup"
                  className="w-full sm:w-auto px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm shadow-pink-200 transition-colors flex items-center justify-center gap-2 group active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create free account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/auth/signin?mode=signin"
                  className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-pink-50 text-pink-600 text-xs sm:text-sm font-semibold rounded-xl border border-pink-200 transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-pink-500" />
                  <span>Login</span>
                </Link>
              </div>

              <div className="mt-6 pt-4 border-t border-pink-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-500" />
                <span>Protected Fleet Scanner Portal</span>
              </div>
            </div>
          </div>
        ) : (
          /* UNLOCKED: Active Session & Dropzone */
          <div className="space-y-4">
            {/* Authenticated Operator Status Bar */}
            <div className="px-4 py-2 rounded-xl bg-white border border-pink-100 shadow-sm shadow-pink-100/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold">
                  Authorized Session: {session.user?.name || session.user?.email || "Fleet Operator"}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
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
              <div className="p-4 card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Car className="w-4 h-4 text-pink-500" />
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
                    className="px-3 py-1.5 bg-white hover:bg-pink-50 text-pink-600 font-medium rounded-lg border border-pink-200 transition-colors"
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
                    className="px-3 py-1.5 bg-white hover:bg-pink-50 text-pink-600 font-medium rounded-lg border border-pink-200 transition-colors"
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
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-700">Notice</p>
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
      <section className="max-w-4xl mx-auto pt-8 border-t border-pink-100">
        <h3 className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
          Enterprise Fleet Recognition Capabilities
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 card flex flex-col items-center text-center hover:border-pink-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center font-bold mb-3 border border-pink-100">
              <Car className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">Instant Localization</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detects vehicle boundary and plate region on bumpers in milliseconds.
            </p>
          </div>

          <div className="p-5 card flex flex-col items-center text-center hover:border-pink-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center font-bold mb-3 border border-pink-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">High-Precision OCR</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              High-accuracy alphanumeric extraction optimized across varied lighting and angles.
            </p>
          </div>

          <div className="p-5 card flex flex-col items-center text-center hover:border-pink-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center font-bold mb-3 border border-pink-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">Regional Analysis</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Validates jurisdiction standards, EV plates, commercial badges, and format structure.
            </p>
          </div>

          <div className="p-5 card flex flex-col items-center text-center hover:border-pink-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center font-bold mb-3 border border-pink-100">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">Cloud Fleet Log</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant encrypted synchronization with high-resolution image archive and database records.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
