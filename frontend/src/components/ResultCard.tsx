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
      ? "text-green-700 bg-green-50 border-green-100"
      : conf >= 50
      ? "text-amber-700 bg-amber-50 border-amber-100"
      : "text-red-600 bg-red-50 border-red-100";

  const ai = result.ai_insights;

  return (
    <div className="w-full card card-glow overflow-hidden animate-fadeIn">
      {/* Card Header */}
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-pink-50/70 to-white border-b border-pink-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500 flex items-center justify-center text-white shadow-sm shadow-pink-200">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Recognition Result</h3>
            <p className="text-xs text-slate-500">Automated Vehicle Plate Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Confidence Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${confColor}`}>
            <Gauge className="w-3.5 h-3.5" />
            <span>{result.confidence}% Confidence</span>
          </div>

          {result.processing_time_ms && (
            <div className="px-2.5 py-1 rounded-full text-xs text-slate-500 bg-white border border-pink-100 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{result.processing_time_ms} ms</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cropped Plate Image */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Detected License Plate Crop
          </label>

          <div className="relative aspect-[3/1.2] bg-slate-50 border border-pink-100 rounded-2xl overflow-hidden flex items-center justify-center p-2 group">
            {result.cropped_image || result.cropped_image_url ? (
              <img
                src={result.cropped_image || result.cropped_image_url}
                alt="Detected License Plate"
                className="max-h-full max-w-full object-contain rounded-xl group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="text-xs text-slate-400 italic">No cropped plate preview available</div>
            )}

            {/* Cloudinary link badge if available */}
            {result.cropped_image_url && (
              <a
                href={result.cropped_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 hover:bg-pink-50 text-[10px] text-pink-600 rounded-lg border border-pink-200 flex items-center gap-1 backdrop-blur-sm transition-colors"
              >
                <span>Cloudinary HD</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* Bounding box information */}
          {result.bbox_coordinates && result.bbox_coordinates.length === 4 && (
            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between gap-2 px-3 py-1.5 bg-pink-50/50 rounded-xl border border-pink-100">
              <span>BBox: [{result.bbox_coordinates.join(", ")}]</span>
              <span className="text-pink-500 text-[10px] shrink-0">Detected BBox</span>
            </div>
          )}
        </div>

        {/* Right Column: Editable Plate Number & Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-pink-500" />
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
                className="w-full bg-white text-slate-800 font-mono text-2xl sm:text-3xl font-extrabold tracking-widest pl-4 sm:pl-5 pr-14 py-3.5 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 focus:outline-none placeholder:text-slate-300 transition"
                placeholder="ABC1234"
              />

              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 p-2 text-pink-500 hover:text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors"
                title="Copy to clipboard"
              >
                {isCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Save Correction Button */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {result.record_id ? (
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  disabled={isSaving || editablePlate === result.plate_number}
                  className="flex items-center gap-1.5 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-sm shadow-pink-200 transition-colors"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
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
                <span className="text-xs text-green-600 font-medium animate-fadeIn">
                  Record updated in Neon PostgreSQL
                </span>
              )}
            </div>
          </div>

          {/* AI Vehicle & Jurisdiction Card */}
          {ai && (
            <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-100">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-pink-600 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Vehicle & Jurisdiction Analysis</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="p-2.5 rounded-xl bg-white border border-pink-100">
                  <span className="text-slate-400 block text-[10px]">Jurisdiction:</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {ai.country_state || "Standard Vehicle Plate"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-pink-100">
                  <span className="text-slate-400 block text-[10px]">Normalized Format:</span>
                  <span className="font-mono font-bold text-pink-600 truncate block">
                    {ai.formatted_plate || editablePlate}
                  </span>
                </div>
              </div>

              {ai.explanation && (
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-pink-100">
                  <Info className="w-3.5 h-3.5 text-pink-500 inline mr-1.5 -mt-0.5" />
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
