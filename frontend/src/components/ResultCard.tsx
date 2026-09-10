"use client";

import React, { useState } from "react";
import { DetectionResult } from "@/types";
import { updatePlate } from "@/lib/api";
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Save,
  Clock,
  Gauge,
  Info,
} from "lucide-react";

interface ResultCardProps {
  result: DetectionResult;
  onPlateUpdated?: (newPlate: string) => void;
}

export default function ResultCard({ result, onPlateUpdated }: ResultCardProps) {
  const [editablePlate, setEditablePlate] = useState(result.plate_number);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(editablePlate);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveCorrection = async () => {
    if (!result.record_id) return;
    setIsSaving(true);
    try {
      await updatePlate(result.record_id, editablePlate);
      setSaveSuccess(true);
      if (onPlateUpdated) {
        onPlateUpdated(editablePlate);
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save correction:", err);
      alert("Failed to save plate correction to the database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Confidence meter color
  const conf = result.confidence;
  const confColor =
    conf >= 80
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : conf >= 50
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-rose-400 bg-rose-500/10 border-rose-500/20";

  const ai = result.ai_insights;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl animate-fadeIn">
      {/* Card Header */}
      <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recognition Result</h3>
            <p className="text-xs text-slate-400">Automated Vehicle Plate Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Confidence Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${confColor}`}>
            <Gauge className="w-3.5 h-3.5" />
            <span>{result.confidence}% Confidence</span>
          </div>

          {result.processing_time_ms && (
            <div className="px-2.5 py-1 rounded-full text-xs text-slate-400 bg-slate-800/80 border border-slate-700/60 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{result.processing_time_ms} ms</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cropped Plate Image */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Detected License Plate Crop
          </label>

          <div className="relative aspect-[3/1.2] bg-black/80 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-2 shadow-inner group">
            {result.cropped_image || result.cropped_image_url ? (
              <img
                src={result.cropped_image || result.cropped_image_url}
                alt="Detected License Plate"
                className="max-h-full max-w-full object-contain rounded-xl group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="text-xs text-slate-500 italic">No cropped plate preview available</div>
            )}

            {/* Cloudinary link badge if available */}
            {result.cropped_image_url && (
              <a
                href={result.cropped_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 hover:bg-slate-800 text-[10px] text-emerald-400 rounded-lg border border-slate-700 flex items-center gap-1 backdrop-blur-sm transition-colors"
              >
                <span>Cloudinary HD</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* Bounding box information */}
          {result.bbox_coordinates && result.bbox_coordinates.length === 4 && (
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between px-3 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span>BBox: [{result.bbox_coordinates.join(", ")}]</span>
              <span className="text-emerald-400 text-[10px]">Detected BBox</span>
            </div>
          )}
        </div>

        {/* Right Column: Editable Plate Number & Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Extracted Plate Number (Editable)</span>
              </label>
              <span className="text-[11px] text-slate-400">Click to edit if needed</span>
            </div>

            {/* High-Contrast License Plate Plate Input Box */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={editablePlate}
                onChange={(e) => setEditablePlate(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 text-white font-mono text-2xl sm:text-3xl font-extrabold tracking-widest px-5 py-3.5 rounded-2xl border-2 border-slate-700/80 focus:border-emerald-500 focus:outline-none shadow-inner"
                placeholder="ABC1234"
              />

              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors"
                title="Copy to clipboard"
              >
                {isCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Save Correction Button */}
            <div className="mt-3 flex items-center justify-between">
              {result.record_id ? (
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  disabled={isSaving || editablePlate === result.plate_number}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-emerald-500/15 transition-all"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                      <span>Saved to Database!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Correction</span>
                    </>
                  )}
                </button>
              ) : (
                <div />
              )}

              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-medium animate-fadeIn">
                  Record updated in Neon PostgreSQL
                </span>
              )}
            </div>
          </div>

          {/* AI Vehicle & Jurisdiction Card */}
          {ai && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Vehicle & Jurisdiction Analysis</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Jurisdiction:</span>
                  <span className="font-semibold text-white truncate block">
                    {ai.country_state || "Standard Vehicle Plate"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Normalized Format:</span>
                  <span className="font-mono font-bold text-cyan-300 truncate block">
                    {ai.formatted_plate || editablePlate}
                  </span>
                </div>
              </div>

              {ai.explanation && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                  <Info className="w-3.5 h-3.5 text-emerald-400 inline mr-1.5 -mt-0.5" />
                  {ai.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
