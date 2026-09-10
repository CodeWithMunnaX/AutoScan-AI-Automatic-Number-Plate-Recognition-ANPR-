"use client";

import React, { useState, useEffect } from "react";
import { HistoryRecord } from "@/types";
import { getHistory, deletePlate } from "@/lib/api";
import {
  Search,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Gauge,
  Sparkles,
  RefreshCw,
  Car,
} from "lucide-react";

export default function HistoryTable() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getHistory(100, 0);
      setRecords(data.records || []);
    } catch (err: any) {
      console.error("Failed to load history:", err);
      setError("Could not load history from the database. Ensure backend and Neon DB are accessible.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scan record?")) return;

    try {
      await deletePlate(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  const filteredRecords = records.filter((r) =>
    r.plate_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header & Search Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Fleet Scan History</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              {filteredRecords.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-400">Stored securely in Neon PostgreSQL Cloud Database</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none w-48 sm:w-60 shadow-inner"
            />
          </div>

          <button
            onClick={fetchRecords}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700/80 transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p>Syncing records from Neon database...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 text-sm max-w-md mx-auto">
            <p className="font-semibold mb-2">Connection Notice</p>
            <p className="text-slate-400 text-xs mb-4">{error}</p>
            <button
              onClick={fetchRecords}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 rounded-xl text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">No vehicle scan records found</p>
            <p className="text-xs text-slate-500 mt-1">
              Upload or photograph a vehicle on the scanner to record recognition entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold pl-2">Plate Preview</th>
                  <th className="pb-3 font-semibold">Plate Number</th>
                  <th className="pb-3 font-semibold">Confidence</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((r) => {
                  let aiData: any = null;
                  if (typeof r.ai_insights === "string") {
                    try {
                      aiData = JSON.parse(r.ai_insights);
                    } catch {}
                  } else {
                    aiData = r.ai_insights;
                  }

                  const conf = r.confidence;
                  const confColor =
                    conf >= 80
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : conf >= 50
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                      : "text-rose-400 bg-rose-500/10 border-rose-500/20";

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-3 pl-2">
                        <div className="w-20 h-10 rounded-lg bg-black/60 border border-slate-800 overflow-hidden flex items-center justify-center">
                          {r.cropped_image_url || r.original_image_url ? (
                            <img
                              src={r.cropped_image_url || r.original_image_url}
                              alt={r.plate_number}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-600">No image</span>
                          )}
                        </div>
                      </td>

                      {/* Plate Number */}
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-sm text-white tracking-wider">
                            {r.plate_number}
                          </span>
                          {aiData?.country_state && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {aiData.country_state}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full font-medium border text-[10px] inline-flex items-center gap-1 ${confColor}`}>
                          <Gauge className="w-3 h-3" />
                          <span>{r.confidence}%</span>
                        </span>
                      </td>

                      {/* Status / Verified */}
                      <td className="py-3">
                        {r.is_verified ? (
                          <span className="px-2 py-0.5 rounded-full font-medium text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">AI Detected</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "Recent"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          {(r.cropped_image_url || r.original_image_url) && (
                            <a
                              href={r.cropped_image_url || r.original_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="View image in Cloudinary"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
