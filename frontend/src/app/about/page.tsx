import Link from "next/link";
import { Github, Globe, Target, Layers, GraduationCap, ScanLine } from "lucide-react";

export const metadata = {
  title: "About · AutoScan AI",
  description: "About AutoScan AI, an automatic number plate recognition project by CodeWithMunnaX.",
};

const STACK = [
  { group: "Machine learning", items: ["YOLOv8n", "ONNX Runtime", "OpenCV", "NumPy", "Gemini Vision"] },
  { group: "Backend", items: ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL (Neon)"] },
  { group: "Frontend", items: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "NextAuth"] },
  { group: "Deployment", items: ["Vercel", "Render", "GitHub"] },
];

const LEARNINGS = [
  "Exporting a PyTorch model to ONNX and writing the pre/post-processing (letterbox, NMS) by hand.",
  "Combining deep learning with classical computer vision instead of training a model for every sub-task.",
  "Measuring and cutting memory use so an ML service fits on free cloud hosting.",
  "Building a full product around a model: auth, storage, history, analytics and an API.",
];

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <section className="card card-glow p-6 sm:p-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-md shadow-pink-200">
          <ScanLine className="w-7 h-7" />
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-800">About AutoScan AI</h1>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto leading-relaxed">
          AutoScan AI is an end-to-end Automatic Number Plate Recognition (ANPR) system. Upload a photo of a vehicle and
          it finds the vehicle, isolates the number plate, reads the characters and identifies the plate&apos;s region
          and type — then keeps a searchable history of every scan.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-500" /> Use cases
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
            <li>Parking lot entry and exit logging</li>
            <li>Gated society and campus vehicle records</li>
            <li>Toll and fleet tracking prototypes</li>
            <li>Learning project for computer vision pipelines</li>
          </ul>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-pink-500" /> What I learned
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
            {LEARNINGS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Layers className="w-5 h-5 text-pink-500" /> Tech stack
        </h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-5">
          {STACK.map((s) => (
            <div key={s.group}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.group}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.items.map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 text-xs font-medium text-pink-700 bg-pink-50 border border-pink-100 rounded-lg"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center text-3xl font-bold shadow-md shadow-pink-200">
          M
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-500">Built by</p>
          <h2 className="text-xl font-bold text-slate-800">Munna Kumar · CodeWithMunnaX</h2>
          <p className="mt-1 text-sm text-slate-600">
            Developer working on machine learning, data science and full-stack web projects.
          </p>
          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
            <a
              href="https://github.com/CodeWithMunnaX"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="https://codewithmunnax.com" target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <Globe className="w-4 h-4" /> codewithmunnax.com
            </a>
          </div>
        </div>
      </section>

      <div className="text-center">
        <Link href="/how-it-works" className="text-sm font-semibold text-pink-600 hover:text-pink-700">
          See how the ML pipeline works →
        </Link>
      </div>
    </div>
  );
}
