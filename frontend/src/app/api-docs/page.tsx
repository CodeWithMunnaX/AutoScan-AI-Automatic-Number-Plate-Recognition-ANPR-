import { Code2, ExternalLink } from "lucide-react";

export const metadata = {
  title: "API · AutoScan AI",
  description: "REST API reference for the AutoScan number plate recognition backend.",
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/detect-plate",
    summary: "Detect and read the number plate in an image.",
    request: `curl -X POST ${BASE_URL}/api/detect-plate \\
  -F "file=@car.jpg"`,
    response: `{
  "success": true,
  "plate_number": "MH12AB1234",
  "confidence": 95.4,
  "bbox_coordinates": [142, 351, 759, 460],
  "record_id": 42,
  "ai_insights": {
    "country_state": "India - Maharashtra",
    "formatted_plate": "MH 12 AB 1234",
    "plate_type": "Private vehicle"
  },
  "processing_time_ms": 4210.5
}`,
  },
  {
    method: "GET",
    path: "/api/history?limit=50&offset=0",
    summary: "List past scans, newest first.",
    request: `curl "${BASE_URL}/api/history?limit=10"`,
    response: `{
  "total": 128,
  "records": [
    { "id": 42, "plate_number": "MH12AB1234", "confidence": 95.4, "is_verified": false, ... }
  ]
}`,
  },
  {
    method: "PUT",
    path: "/api/plates/{id}",
    summary: "Correct a plate number; marks the record as verified.",
    request: `curl -X PUT ${BASE_URL}/api/plates/42 \\
  -H "Content-Type: application/json" \\
  -d '{"plate_number": "MH12AB1235"}'`,
    response: `{ "success": true, "record": { "id": 42, "plate_number": "MH12AB1235", "is_verified": true, ... } }`,
  },
  {
    method: "DELETE",
    path: "/api/plates/{id}",
    summary: "Delete a scan record.",
    request: `curl -X DELETE ${BASE_URL}/api/plates/42`,
    response: `{ "success": true, "message": "Record 42 deleted successfully" }`,
  },
  {
    method: "POST",
    path: "/api/auth/signup",
    summary: "Create an account. Passwords are stored as PBKDF2-SHA256 hashes.",
    request: `curl -X POST ${BASE_URL}/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Munna", "email": "munna@example.com", "password": "secret123"}'`,
    response: `{ "success": true, "user": { "id": 1, "name": "Munna", "email": "munna@example.com" } }`,
  },
  {
    method: "GET",
    path: "/api/health",
    summary: "Service status and configured integrations.",
    request: `curl ${BASE_URL}/api/health`,
    response: `{ "status": "online", "gemini_configured": true, ... }`,
  },
];

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-emerald-50 text-emerald-700 border-emerald-100",
  POST: "bg-pink-50 text-pink-700 border-pink-200",
  PUT: "bg-amber-50 text-amber-700 border-amber-100",
  DELETE: "bg-red-50 text-red-600 border-red-100",
};

export default function ApiDocsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Code2 className="w-7 h-7 text-pink-500" />
          API Reference
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          The AutoScan backend is a FastAPI service. Base URL:{" "}
          <code className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 text-xs break-all">{BASE_URL}</code>
        </p>
        <a
          href={`${BASE_URL}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mt-4"
        >
          Interactive Swagger docs
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-5">
        {ENDPOINTS.map((ep) => (
          <section key={ep.method + ep.path} className="card overflow-hidden">
            <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2 border-b border-pink-100 bg-gradient-to-r from-pink-50/70 to-white">
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${METHOD_STYLE[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-sm font-semibold text-slate-800 break-all">{ep.path}</code>
              <span className="w-full sm:w-auto sm:ml-auto text-xs text-slate-500">{ep.summary}</span>
            </div>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-pink-50">
              <CodeBlock label="Request" code={ep.request} />
              <CodeBlock label="Response" code={ep.response} />
            </div>
          </section>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Note: the free-tier server sleeps after 15 minutes of inactivity; the first request after that can take up to a
        minute.
      </p>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="p-4 sm:p-5 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">{label}</p>
      <pre className="text-xs leading-relaxed text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}
