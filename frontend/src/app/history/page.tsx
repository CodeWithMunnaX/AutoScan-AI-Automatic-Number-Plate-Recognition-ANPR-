"use client";

import React from "react";
import HistoryTable from "@/components/HistoryTable";
import Link from "next/link";
import { ArrowLeft, Scan } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      {/* Back button & Page Title */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-pink-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scanner</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold rounded-xl shadow-sm shadow-pink-200 transition-colors"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>New Vehicle Scan</span>
        </Link>
      </div>

      <HistoryTable />
    </div>
  );
}
