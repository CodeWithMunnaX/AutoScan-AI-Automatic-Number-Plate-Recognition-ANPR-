# 🚗 AutoScan AI - Automatic Number Plate Recognition (ANPR)

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-blueviolet?style=for-the-badge)](https://github.com/ultralytics/ultralytics)
[![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://opencv.org/)
[![EasyOCR](https://img.shields.io/badge/EasyOCR-JaidedAI-orange?style=for-the-badge)](https://github.com/JaidedAI/EasyOCR)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-Google-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

A full-stack, AI-powered **Automatic Number Plate Recognition (ANPR)** and vehicle intelligence platform. **AutoScan AI** combines computer vision models (**YOLOv8** and **OpenCV**), deep learning OCR (**EasyOCR** with alphanumeric heuristic correction), multi-modal LLM vehicle reasoning (**Google Gemini AI**), serverless PostgreSQL (**Neon DB**), and secure cloud storage (**Cloudinary**) with a reactive **Next.js** dashboard.

---

## 📸 Overview & Highlights

- ⚡ **Dual Input Pipeline**: Drag-and-drop vehicle photos (JPEG, PNG, WEBP) or capture in real time using laptop/mobile webcams with a live viewfinder alignment guide.
- 🎯 **High-Precision License Plate Detection**: YOLOv8 plate detector backed by an OpenCV adaptive edge-and-contour detection fallback.
- 🔬 **Adaptive Image Preprocessing**: Bilateral filtering, grayscaling, adaptive Otsu thresholding, and contrast normalization for crisp character recognition even under harsh glare or shadows.
- 🔤 **Smart Alphanumeric Correction**: Heuristic regex rules and OCR confusions resolving common character ambiguities (`O` ↔ `0`, `I` ↔ `1`, `Z` ↔ `2`, `B` ↔ `8`, etc.).
- 🧠 **Gemini AI Vehicle Intelligence**: Analyzes jurisdiction (State / Country), plate standard formatting, and vehicle classification directly from image context.
- ✍️ **Human-in-the-Loop Verification**: Large high-contrast editable plate readout allowing operators to review, modify, and confirm plate numbers in one click.
- 🗄️ **Persistent Cloud History**: Detections, confidence scores, cropped plates, and timestamps stored in Neon PostgreSQL and Cloudinary.
- 🔐 **NextAuth Authentication**: Support for Google OAuth, GitHub OAuth, and fleet operator credentials.

---

## 🏗️ System Architecture

```
                                 ┌─────────────────────────────────┐
                                 │   Next.js 14 Frontend Client    │
                                 │  (App Router, React, Tailwind)  │
                                 └───────────────┬─────────────────┘
                                                 │
                                     Multipart Image Upload
                                                 │
                                                 ▼
                                 ┌─────────────────────────────────┐
                                 │       FastAPI REST Engine       │
                                 └───────────────┬─────────────────┘
                                                 │
                        ┌────────────────────────┼────────────────────────┐
                        ▼                        ▼                        ▼
              ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
              │  YOLOv8 Detector │     │ OpenCV Fallback  │     │ Cloudinary Store │
              │  (Bounding Box)  │     │ (Edge & Contour) │     │ (Vehicle & Crop) │
              └─────────┬────────┘     └─────────┬────────┘     └──────────────────┘
                        └───────────────┬────────┘
                                        ▼
                             ┌─────────────────────┐
                             │ Preprocessing Engine│
                             │ (Denoise, Otsu, EQ) │
                             └──────────┬──────────┘
                                        ▼
                             ┌─────────────────────┐
                             │    EasyOCR Engine   │
                             │  + Heuristic Regex  │
                             └──────────┬──────────┘
                                        ▼
                             ┌─────────────────────┐
                             │   Google Gemini AI  │
                             │(Jurisdiction Insight)│
                             └──────────┬──────────┘
                                        │
                                        ▼
                             ┌─────────────────────┐
                             │   Neon PostgreSQL   │
                             │  (Persistent Record)│
                             └─────────────────────┘
```

---

## 📁 Repository Structure

```
AutoScan-AI/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── detection.py            # SQLAlchemy detection schema (Neon DB)
│   │   ├── routes/
│   │   │   ├── detection.py            # /api/detect-plate, /api/history endpoints
│   │   │   └── health.py               # /api/health monitoring
│   │   ├── schemas/
│   │   │   └── detection.py            # Pydantic validation models
│   │   ├── services/
│   │   │   ├── cloudinary_service.py   # Cloudinary image upload handler
│   │   │   ├── detector.py             # YOLOv8 + OpenCV plate detection
│   │   │   ├── gemini_service.py       # Gemini AI vehicle & plate insights
│   │   │   └── ocr_service.py          # OpenCV enhancement + EasyOCR pipeline
│   │   ├── config.py                   # Environment settings & config
│   │   ├── database.py                 # PostgreSQL connection pool & sessions
│   │   └── main.py                     # FastAPI application setup & CORS
│   ├── .env.example                    # Template environment variables for backend
│   └── requirements.txt                # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/auth/[...nextauth]/ # NextAuth authentication routes
│   │   │   ├── auth/signin/            # Sign-in page
│   │   │   ├── history/                # Scanned records history dashboard
│   │   │   ├── globals.css             # Tailwind CSS styles & animations
│   │   │   ├── layout.tsx              # Root layout & session wrapper
│   │   │   └── page.tsx                # Main detection scanner interface
│   │   ├── components/
│   │   │   ├── AuthProvider.tsx        # NextAuth SessionProvider wrapper
│   │   │   ├── CameraModal.tsx         # Live camera viewfinder & capture modal
│   │   │   ├── Dropzone.tsx            # Drag & Drop upload zone with animations
│   │   │   ├── HistoryTable.tsx        # Searchable scan history data table
│   │   │   ├── Navbar.tsx              # Responsive navigation header
│   │   │   └── ResultCard.tsx          # High-contrast plate card with Gemini insight
│   │   ├── lib/
│   │   │   ├── api.ts                  # Axios API client
│   │   │   └── auth.ts                 # NextAuth providers configuration
│   │   └── types/
│   │       └── index.ts                # TypeScript type definitions
│   ├── .env.example                    # Template environment variables for frontend
│   ├── package.json                    # Node dependencies & scripts
│   ├── tailwind.config.ts              # Tailwind design configuration
│   └── tsconfig.json                   # TypeScript configuration
│
├── .gitignore                          # Git ignore configuration
└── README.md                           # Project documentation
```

---

## 🛠️ Tech Stack & Dependencies

### Backend
- **Python 3.10+**
- **FastAPI**: Asynchronous REST API framework
- **Uvicorn**: High-performance ASGI server
- **Ultralytics YOLOv8**: Real-time object and license plate detection
- **OpenCV (opencv-python-headless)**: Computer vision and image processing
- **EasyOCR**: Deep learning optical character recognition
- **SQLAlchemy & psycopg2-binary**: ORM and PostgreSQL driver
- **Google Generative AI**: Gemini multimodal LLM for vehicle analysis
- **Cloudinary SDK**: Cloud-hosted image storage and transformations

### Frontend
- **Next.js 14** (App Router)
- **React 18** & **TypeScript**
- **Tailwind CSS**: Modern utility-first styling
- **Lucide React**: Clean vector icon suite
- **Axios**: HTTP client for API communication
- **NextAuth.js**: Authentication handling OAuth (Google, GitHub) and Credentials

---

## 🚀 Getting Started

### Prerequisites
- [Git](https://git-scm.com/) installed
- [Python 3.10+](https://www.python.org/downloads/) installed
- [Node.js 18+](https://nodejs.org/) installed
- A [Neon](https://neon.tech/) PostgreSQL account (or local PostgreSQL)
- A [Cloudinary](https://cloudinary.com/) account
- A [Google AI Studio](https://aistudio.google.com/) Gemini API key

---

### 1. Clone the Repository

```bash
git clone https://github.com/CodeWithMunnaX/AutoScan-AI-Automatic-Number-Plate-Recognition-ANPR-.git
cd AutoScan-AI-Automatic-Number-Plate-Recognition-ANPR-
```

---

### 2. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your credentials in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   GEMINI_API_KEY=your_gemini_api_key
   PORT=8000
   HOST=0.0.0.0
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

5. **Run the Backend Server**:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   - Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 3. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Configure the variables in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate_a_random_secret_string

   # Optional OAuth Providers
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_ID=your_github_client_id
   GITHUB_SECRET=your_github_client_secret
   ```

4. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```
   - Open your browser at [http://localhost:3000](http://localhost:3000)

---

## 📡 API Reference

### 1. Detect License Plate
- **URL**: `POST /api/detect-plate`
- **Content-Type**: `multipart/form-data`
- **Body Parameter**: `file` (Image file: PNG, JPEG, WEBP)
- **Response**:
```json
{
  "success": true,
  "plate_number": "MH12AB1234",
  "confidence": 96.5,
  "bbox_coordinates": [120, 350, 480, 440],
  "cropped_image": "data:image/jpeg;base64,...",
  "original_image_url": "https://res.cloudinary.com/...",
  "cropped_image_url": "https://res.cloudinary.com/...",
  "record_id": 42,
  "ai_insights": {
    "jurisdiction": "Maharashtra, India",
    "vehicle_category": "Private Passenger Vehicle",
    "standard_format": true,
    "notes": "Standard high-security registration plate (HSRP)"
  }
}
```

### 2. Get Detection History
- **URL**: `GET /api/history`
- **Query Parameters**: `limit` (default: 50), `offset` (default: 0)
- **Response**: Array of detection records with image URLs, confidence, and timestamps.

### 3. Update / Verify Record
- **URL**: `PUT /api/history/{id}`
- **Body**:
```json
{
  "plate_number": "MH12AB1234",
  "is_verified": true
}
```

### 4. Delete Record
- **URL**: `DELETE /api/history/{id}`
- **Response**: `{ "success": true, "message": "Record deleted successfully" }`

### 5. Health Check
- **URL**: `GET /api/health`
- **Response**: `{ "status": "healthy", "service": "AutoScan-AI-ANPR" }`

---

## 🛡️ Security & Privacy

- **No Secrets in Source Control**: All sensitive credentials (`.env`, `.env.local`, API keys, passwords) are strictly excluded via `.gitignore`.
- **CORS Restricted**: Backend allows only authorized frontend origins (`ALLOWED_ORIGINS`).
- **Encrypted Communication**: Supports SSL connections for database transactions (`sslmode=require`).

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/awesome-feature`
3. Commit your changes: `git commit -m "Add awesome feature"`
4. Push to the branch: `git push origin feature/awesome-feature`
5. Open a Pull Request.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
