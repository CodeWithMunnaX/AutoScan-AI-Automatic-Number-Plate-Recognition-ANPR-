"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, ScanLine, Gauge, BadgeCheck, MapPin, Loader2, AlertCircle } from "lucide-react";
import { getHistory } from "@/lib/api";
import { AiInsights, HistoryRecord } from "@/types";

const DAYS = 14;
const CONFIDENCE_BUCKETS = [
  { label: "<50%", min: 0, max: 50 },
  { label: "50–70%", min: 50, max: 70 },
  { label: "70–85%", min: 70, max: 85 },
  { label: "85–95%", min: 85, max: 95 },
  { label: "95%+", min: 95, max: 101 },
];

function parseInsights(raw: HistoryRecord["ai_insights"]): AiInsights {
  if (!raw) return {};
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function countBy(values: string[]): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export default function DashboardPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHistory(500, 0)
      .then((data) => setRecords(data.records))
      .catch(() => setError("Could not load scan data. The server may be waking up — refresh in a minute."))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const detected = records.filter((r) => !r.plate_number.includes("NOPLATE"));
    const avgConfidence = detected.length
      ? detected.reduce((sum, r) => sum + (r.confidence || 0), 0) / detected.length
      : 0;
    const insights = detected.map((r) => parseInsights(r.ai_insights));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const perDay = Array.from({ length: DAYS }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (DAYS - 1 - i));
      return { date: day, value: 0 };
    });
    records.forEach((r) => {
      if (!r.created_at) return;
      const d = new Date(r.created_at.endsWith("Z") ? r.created_at : r.created_at + "Z");
      d.setHours(0, 0, 0, 0);
      const slot = perDay.find((p) => p.date.getTime() === d.getTime());
      if (slot) slot.value += 1;
    });

    return {
      total: records.length,
      detected: detected.length,
      avgConfidence,
      verifiedPct: records.length ? (records.filter((r) => r.is_verified).length / records.length) * 100 : 0,
      perDay: perDay.map((p) => ({
        label: p.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        value: p.value,
      })),
      confidence: CONFIDENCE_BUCKETS.map((b) => ({
        label: b.label,
        value: detected.filter((r) => r.confidence >= b.min && r.confidence < b.max).length,
      })),
      // "Auto-detected standard format" is the backend's fallback when Gemini analysis is unavailable
      regions: countBy(
        insights.map((i) =>
          !i.country_state || i.country_state.startsWith("Auto-detected") ? "Unknown" : i.country_state
        )
      ).slice(0, 6),
      plateTypes: countBy(insights.map((i) => i.plate_type || "Unknown")).slice(0, 6),
    };
  }, [records]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-pink-500" />
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Model performance and scan activity across all recognitions.
          </p>
        </div>
        <Link href="/" className="btn-primary self-start sm:self-auto">
          <ScanLine className="w-4 h-4" />
          New scan
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile icon={<ScanLine className="w-4 h-4" />} label="Total scans" value={stats.total.toString()} />
        <StatTile
          icon={<BadgeCheck className="w-4 h-4" />}
          label="Plates detected"
          value={stats.detected.toString()}
          hint={stats.total ? `${Math.round((stats.detected / stats.total) * 100)}% detection rate` : undefined}
        />
        <StatTile
          icon={<Gauge className="w-4 h-4" />}
          label="Avg. confidence"
          value={stats.detected ? `${stats.avgConfidence.toFixed(1)}%` : "—"}
        />
        <StatTile
          icon={<MapPin className="w-4 h-4" />}
          label="Manually verified"
          value={stats.total ? `${stats.verifiedPct.toFixed(0)}%` : "—"}
        />
      </div>

      {stats.total === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-600 font-medium">No scans yet</p>
          <p className="mt-1 text-sm text-slate-400">Scan your first vehicle to see analytics here.</p>
        </div>
      ) : (
        <>
          <ChartCard title="Scans per day" subtitle={`Last ${DAYS} days`}>
            <ColumnChart data={stats.perDay} unit="scans" />
          </ChartCard>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Confidence distribution" subtitle="Detected plates by model confidence">
              <ColumnChart data={stats.confidence} unit="plates" />
            </ChartCard>
            <ChartCard title="Top regions" subtitle="Jurisdiction identified by Gemini">
              <BarList data={stats.regions} unit="plates" />
            </ChartCard>
          </div>

          <ChartCard title="Plate types" subtitle="Vehicle registration category">
            <BarList data={stats.plateTypes} unit="plates" />
          </ChartCard>
        </>
      )}
    </div>
  );
}

function StatTile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="w-7 h-7 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-2xl sm:text-3xl font-bold text-slate-800 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-6">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="text-xs text-slate-400 mb-4">{subtitle}</p>
      {children}
    </section>
  );
}

/** Vertical bars with a baseline axis, recessive gridlines and a per-bar hover tooltip. */
function ColumnChart({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = [max, Math.round(max / 2), 0].filter((v, i, a) => a.indexOf(v) === i);
  const showEvery = data.length > 8 ? 2 : 1;

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between h-44 pb-6 text-[10px] text-slate-400 tabular-nums text-right w-6 shrink-0">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-x-0 top-0 h-44 pb-6 flex flex-col justify-between pointer-events-none">
          {ticks.map((t) => (
            <div key={t} className="border-t border-dashed border-pink-100" />
          ))}
        </div>
        <div className="relative h-44 flex items-end gap-[2px] pb-6">
          {data.map((d, i) => (
            <div
              key={d.label}
              className="relative flex-1 h-full flex flex-col justify-end items-center group"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className={`w-full max-w-[28px] rounded-t-[4px] transition-colors ${
                  hover === i ? "bg-pink-600" : "bg-pink-400"
                }`}
                style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 0 }}
              />
              <span className="absolute -bottom-5 text-[10px] text-slate-400 whitespace-nowrap">
                {(data.length - 1 - i) % showEvery === 0 ? d.label : ""}
              </span>
              {hover === i && (
                <div className="absolute bottom-full mb-1 z-10 px-2 py-1 rounded-lg bg-slate-800 text-white text-[11px] whitespace-nowrap shadow-lg">
                  <span className="font-semibold tabular-nums">{d.value}</span> {unit} · {d.label}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-6 border-t border-slate-300" />
      </div>
    </div>
  );
}

/** Ranked horizontal bars with direct value labels. */
function BarList({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="text-sm text-slate-400">No data yet.</p>;
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} title={`${d.label}: ${d.value} ${unit}`}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 truncate pr-2">{d.label}</span>
            <span className="font-semibold text-slate-800 tabular-nums">{d.value}</span>
          </div>
          <div className="h-2 rounded-full bg-pink-50">
            <div className="h-2 rounded-full bg-pink-400" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
