"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, Check, AlertCircle } from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedDataUrl(null);
      setError(null);
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (mode: "environment" | "user") => {
    stopCamera();
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser or device.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission denied. Please enable camera access in your browser settings."
          : `Unable to access camera: ${err.message || "Unknown error"}`
      );
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedDataUrl(dataUrl);
    }
    setIsCapturing(false);
  };

  const confirmCapture = () => {
    if (!canvasRef.current || !capturedDataUrl) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `anpr_capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          onCapture(file);
          onClose();
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const retakeSnapshot = () => {
    setCapturedDataUrl(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-2xl shadow-pink-200/40 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-pink-100 bg-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-pink-500" />
            <span className="font-semibold text-slate-800">Live Camera Capture</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative flex-1 bg-slate-900 flex items-center justify-center min-h-[320px] max-h-[500px] overflow-hidden">
          {error ? (
            <div className="p-6 text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Camera Access Blocked</p>
              <p className="text-sm text-slate-400 mb-4">{error}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : capturedDataUrl ? (
            // Frozen captured image review
            <img
              src={capturedDataUrl}
              alt="Snapshot"
              className="w-full h-full object-contain max-h-[500px]"
            />
          ) : (
            // Real-time video stream
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[500px]"
              />

              {/* License Plate Framing Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-full max-w-sm aspect-[4/1.6] border-2 border-dashed border-pink-300/90 rounded-xl flex flex-col items-center justify-center bg-pink-500/10 shadow-[0_0_25px_rgba(236,72,153,0.3)]">
                  <span className="text-xs font-semibold text-pink-600 tracking-wider uppercase bg-white/90 px-2.5 py-0.5 rounded-full border border-pink-200">
                    Align Plate Here
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Hidden Canvas for capture rendering */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-white border-t border-pink-100 flex items-center justify-between gap-2">
          {!capturedDataUrl ? (
            <>
              <button
                type="button"
                onClick={toggleFacingMode}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-pink-600 bg-white hover:bg-pink-50 border border-pink-200 rounded-xl transition-colors"
                title="Switch Camera (Front / Back)"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Flip Camera</span>
              </button>

              <button
                type="button"
                onClick={captureSnapshot}
                disabled={Boolean(error) || isCapturing}
                className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-semibold rounded-full shadow-md shadow-pink-200 active:scale-95 transition-all"
              >
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                <span>Snap Photo</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-pink-600 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={retakeSnapshot}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-pink-600 bg-white hover:bg-pink-50 border border-pink-200 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={confirmCapture}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl shadow-md shadow-pink-200 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
