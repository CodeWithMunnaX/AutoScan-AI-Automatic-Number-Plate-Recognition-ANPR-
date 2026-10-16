import Link from "next/link";
import { Upload, Car, Crop, ScanText, Sparkles, Database, ArrowDown, Cpu, ScanLine } from "lucide-react";

export const metadata = {
  title: "How it works · AutoScan AI",
  description: "The computer vision and AI pipeline behind AutoScan's number plate recognition.",
};

const STEPS = [
  {
    icon: Upload,
    title: "1. Image input",
    body: "A photo is uploaded or captured from the camera and decoded with OpenCV into a BGR pixel array.",
    tags: ["OpenCV", "NumPy"],
  },
  {
    icon: Car,
    title: "2. Vehicle detection — YOLOv8n",
    body: "The image is letterboxed to 640×640 and passed through YOLOv8n (COCO-pretrained), exported to ONNX and run on ONNX Runtime. Detections below 0.25 confidence are dropped and overlapping boxes are merged with Non-Max Suppression (IoU 0.45). The most confident car, motorcycle, bus or truck is kept.",
    tags: ["YOLOv8n", "ONNX Runtime", "NMS"],
  },
  {
    icon: Crop,
    title: "3. Plate localisation — classical CV",
    body: "Inside the vehicle box, OpenCV searches for the plate: HSV colour masks for white, yellow, green (EV) and red plates, morphological closing, then contour filtering by aspect ratio (1.8–5.8) and area. If colour fails, a Sobel vertical-edge + Otsu threshold pass finds dense character regions. The crop is padded so trailing characters are never cut.",
    tags: ["HSV masking", "Morphology", "Sobel", "Contours"],
  },
  {
    icon: ScanText,
    title: "4. Text recognition — Gemini Vision",
    body: "The plate crop is resized, denoised with a bilateral filter and contrast-enhanced with CLAHE, then read by Gemini's multimodal vision model. If the crop yields fewer than 6 characters, the full image is sent as a fallback. Regex post-processing fixes common OCR confusions (O→0, I→1, S→5, B→8) between digits.",
    tags: ["CLAHE", "Gemini Vision", "Regex"],
  },
  {
    icon: Sparkles,
    title: "5. Format analysis",
    body: "Gemini classifies the plate's jurisdiction (e.g. India – Maharashtra), registration type and canonical spacing (MH 12 AB 1234), returning structured JSON.",
    tags: ["LLM", "Structured output"],
  },
  {
    icon: Database,
    title: "6. Scoring & storage",
    body: "Overall confidence = 40% detection score + 60% recognition score. Each result is stored in PostgreSQL (Neon) so it can be reviewed, corrected and analysed on the dashboard.",
    tags: ["FastAPI", "SQLAlchemy", "PostgreSQL"],
  },
];

const SPECS = [
  ["Detector", "YOLOv8n (COCO, 80 classes)"],
  ["Runtime", "ONNX Runtime, CPU"],
  ["Input size", "640 × 640, letterboxed"],
  ["Model size", "12.8 MB"],
  ["Server memory", "≈ 200 MB"],
  ["OCR", "Gemini Vision (multimodal LLM)"],
  ["Backend", "FastAPI on Render"],
  ["Frontend", "Next.js 15 on Vercel"],
];

export default function HowItWorksPage() {
  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-pink-600 bg-pink-50 border border-pink-200 rounded-full">
          <Cpu className="w-3.5 h-3.5" /> ML Pipeline
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-800">How AutoScan reads a number plate</h1>
        <p className="mt-3 text-slate-500">
          A hybrid pipeline: a deep-learning detector finds the vehicle, classical computer vision isolates the plate,
          and a multimodal model reads it.
        </p>
      </div>

      <ol className="max-w-3xl mx-auto">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <div className="card p-5 sm:p-6 flex gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-sm shadow-pink-200">
                <step.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">{step.title}</h2>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{step.body}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {step.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 text-[11px] font-medium text-pink-600 bg-pink-50 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex justify-center py-2 text-pink-300">
                <ArrowDown className="w-5 h-5" />
              </div>
            )}
          </li>
        ))}
      </ol>

      <section className="max-w-3xl mx-auto card overflow-hidden">
        <h2 className="px-5 sm:px-6 py-4 font-semibold text-slate-800 bg-gradient-to-r from-pink-50/70 to-white border-b border-pink-100">
          Model & system specs
        </h2>
        <dl className="divide-y divide-pink-50">
          {SPECS.map(([k, v]) => (
            <div key={k} className="px-5 sm:px-6 py-3 flex justify-between gap-4 text-sm">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium text-slate-800 text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="max-w-3xl mx-auto card p-5 sm:p-6">
        <h2 className="font-semibold text-slate-800">Why this design?</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
          <li>
            Swapping PyTorch for ONNX Runtime cut server memory from over 2 GB to about 200 MB, so the model runs on a
            free-tier instance.
          </li>
          <li>
            Classical CV for plate localisation needs no extra training data and works across Indian plate colours.
          </li>
          <li>
            A vision LLM handles varied fonts, angles and lighting better than a small on-device OCR model, at the cost
            of an external API call.
          </li>
          <li>
            Known limits: very small or heavily angled plates, and multiple vehicles in one frame (only the most
            confident vehicle is read).
          </li>
        </ul>
      </section>

      <div className="text-center">
        <Link href="/" className="btn-primary">
          <ScanLine className="w-4 h-4" />
          Try the scanner
        </Link>
      </div>
    </div>
  );
}
