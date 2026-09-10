"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, Camera, Image as ImageIcon, X, Sparkles, Loader2 } from "lucide-react";
import CameraModal from "./CameraModal";

interface DropzoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onDetect: () => void;
  isLoading: boolean;
}

export default function Dropzone({
  selectedFile,
  onFileSelect,
  onDetect,
  isLoading,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update preview URL whenever selectedFile changes
  React.useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClear = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Upload / Preview Area */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
            isDragOver
              ? "border-emerald-500 bg-emerald-500/10 shadow-xl shadow-emerald-500/20 scale-[1.01]"
              : "border-slate-800 hover:border-emerald-500/50 bg-slate-900/60 hover:bg-slate-900/90"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            {/* Animated Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/10">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
              Upload Vehicle or License Plate Image
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              Drag and drop car photo here, or browse files from your device. Supports JPG, PNG, WEBP.
            </p>

            {/* Quick Actions Buttons */}
            <div
              className="flex flex-wrap items-center justify-center gap-3 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Browse File</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Open Live Camera</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview Box */
        <div className="relative border border-slate-800 bg-slate-900/80 rounded-3xl p-4 sm:p-6 overflow-hidden backdrop-blur-md">
          {/* Top Preview Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[200px] sm:max-w-md">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-slate-500">
                ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>

            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Image Container with Scanning Effect */}
          <div className="relative rounded-2xl overflow-hidden bg-black/80 max-h-[420px] flex items-center justify-center border border-slate-800/80">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Selected preview"
                className="max-h-[400px] w-full object-contain rounded-2xl"
              />
            )}

            {/* Scanning Laser Animation during Loading */}
            {isLoading && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-start">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] animate-scan-line" />
                <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[2px] flex flex-col items-center justify-center">
                  <div className="bg-slate-950/90 border border-emerald-500/40 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <div>
                      <p className="text-sm font-bold text-white">Scanning Vehicle & License Plate...</p>
                      <p className="text-[11px] text-emerald-400/80 font-medium">Precision Optical Recognition</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/70 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/70 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
              >
                Retake with Camera
              </button>
            </div>

            <button
              type="button"
              onClick={onDetect}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                  <span>Recognize Plate</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => onFileSelect(file)}
      />
    </div>
  );
}
