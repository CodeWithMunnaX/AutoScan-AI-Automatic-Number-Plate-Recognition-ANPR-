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
    <div className="w-full card card-glow overflow-hidden">
      {/* Header & Search Bar */}
      <div className="p-5 sm:p-6 border-b border-pink-100 bg-gradient-to-r from-pink-50/70 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex flex-wrap items-center gap-2">
            <span>Fleet Scan History</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-600 font-semibold border border-pink-200">
              {filteredRecords.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-500">Stored securely in Neon PostgreSQL Cloud Database</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-pink-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none w-full sm:w-60 transition"
            />
          </div>

          <button
            onClick={fetchRecords}
            disabled={isLoading}
            className="p-2 text-pink-600 bg-white hover:bg-pink-50 rounded-xl border border-pink-200 transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-pink-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-pink-500 mb-3" />
            <p>Syncing records from Neon database...</p>
          </div>
        ) : error ? (
          <div className="py-10 px-4 text-center text-red-600 text-sm max-w-md mx-auto bg-red-50 border border-red-100 rounded-2xl">
            <p className="font-semibold mb-2">Connection Notice</p>
            <p className="text-red-500/90 text-xs mb-4">{error}</p>
            <button
              onClick={fetchRecords}
              className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <Car className="w-12 h-12 text-pink-200 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No vehicle scan records found</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload or photograph a vehicle on the scanner to record recognition entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-pink-100 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold pl-2">Plate Preview</th>
                  <th className="pb-3 font-semibold">Plate Number</th>
                  <th className="pb-3 font-semibold">Confidence</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
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
                      ? "text-green-700 bg-green-50 border-green-100"
                      : conf >= 50
                      ? "text-amber-700 bg-amber-50 border-amber-100"
                      : "text-red-600 bg-red-50 border-red-100";

                  return (
                    <tr key={r.id} className="hover:bg-pink-50/50 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-3 pl-2">
                        <div className="w-20 h-10 rounded-lg bg-slate-50 border border-pink-100 overflow-hidden flex items-center justify-center">
                          {r.cropped_image_url || r.original_image_url ? (
                            <img
                              src={r.cropped_image_url || r.original_image_url}
                              alt={r.plate_number}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400">No image</span>
                          )}
                        </div>
                      </td>

                      {/* Plate Number */}
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-sm text-slate-800 tracking-wider whitespace-nowrap">
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
                          <span className="px-2 py-0.5 rounded-full font-medium text-[10px] bg-pink-50 text-pink-600 border border-pink-200 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] whitespace-nowrap">AI Detected</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap pr-3">
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
                              className="p-1.5 text-slate-400 hover:text-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
                              title="View image in Cloudinary"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
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
