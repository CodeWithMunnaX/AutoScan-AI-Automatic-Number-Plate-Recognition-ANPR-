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
          className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
            isDragOver
              ? "border-pink-400 bg-pink-50 shadow-lg shadow-pink-100 scale-[1.01]"
              : "border-pink-200 hover:border-pink-300 bg-white hover:bg-pink-50/40 shadow-sm shadow-pink-100/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            {/* Animated Icon */}
            <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-500 mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1 tracking-tight">
              Upload Vehicle or License Plate Image
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-pink-50 text-pink-600 text-xs sm:text-sm font-semibold rounded-xl border border-pink-200 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-pink-500" />
                <span>Browse File</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-pink-200 transition-colors active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Open Live Camera</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview Box */
        <div className="relative card card-glow p-4 sm:p-6 overflow-hidden">
          {/* Top Preview Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon className="w-4 h-4 text-pink-500 shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-slate-700 truncate max-w-[160px] sm:max-w-md">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-slate-400 shrink-0">
                ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>

            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Image Container with Scanning Effect */}
          <div className="relative rounded-2xl overflow-hidden bg-pink-50/50 max-h-[420px] flex items-center justify-center border border-pink-100">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Selected preview"
                className="max-h-[400px] w-full object-contain rounded-2xl"
              />
            )}

            {/* Scanning Laser Animation during Loading */}
            {isLoading && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex flex-col items-center justify-center">
                  <div className="bg-white border border-pink-200 px-5 sm:px-6 py-3.5 rounded-2xl shadow-lg shadow-pink-100 flex items-center gap-3 mx-4">
                    <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Scanning Vehicle & License Plate...</p>
                      <p className="text-[11px] text-pink-500 font-medium">Precision Optical Recognition</p>
                    </div>
                  </div>
                </div>
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_16px_#ec4899] animate-scan-line" />
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
                className="px-3 py-2 text-xs font-medium text-pink-600 bg-white hover:bg-pink-50 rounded-xl border border-pink-200 transition-colors disabled:opacity-50"
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-medium text-pink-600 bg-white hover:bg-pink-50 rounded-xl border border-pink-200 transition-colors disabled:opacity-50"
              >
                Retake with Camera
              </button>
            </div>

            <button
              type="button"
              onClick={onDetect}
              disabled={isLoading}
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-pink-200 transition-colors active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white fill-current" />
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
