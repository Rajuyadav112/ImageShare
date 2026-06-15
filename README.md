# AuraShare AI (ImageShare) 🚀

AuraShare AI is a premium, full-stack image management and AI processing platform. It allows users to instantly upload any image and get a live, public, and embeddable URL to share or use anywhere on the web. It also features free, server-side AI-powered background removal and an interactive Media AI Copilot.

---

## ✨ Features

- **Instant Image Sharing:** Upload any image and immediately get a live, copy-pasteable link to embed or share anywhere.
- **AI Background Removal (Free & Offline):** Built-in local AI removal powered by `rembg` (ONNX Runtime) that processes images in seconds without external API keys or costs.
- **Direct-to-Cloud Uploads:** Uses secure presigned URLs to upload files directly to Cloudflare R2 / AWS S3, bypassing server bottlenecks for ultra-fast performance.
- **Media AI Copilot:** A side-docked chatbot that assists in generating or editing images using natural language queries.
- **Storage Analytics Dashboard:** Real-time tracking of uploads, storage quota consumed, and bandwidth usage.
- **Secure Authentication:** JWT-based user authentication (signup, login, and superadmin management console).

---

## 🛠️ Tech Stack

### Frontend (Next.js)
- **Framework:** Next.js (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Vanilla CSS & Tailwind hybrid)
- **State & API Handling:** Fetch API with dynamically configured authorization headers

### Backend (FastAPI)
- **Framework:** FastAPI (Python 3.10+)
- **ORM / Database:** SQLModel (SQLAlchemy + Pydantic) with SQLite (local) / Supabase (production)
- **AI Engine:** `rembg[cpu]` & ONNX Runtime
- **Storage Service:** Boto3 (Amazon S3 / Cloudflare R2 wrapper)

---

## 📁 Project Structure

```text
├── apps/
│   ├── api/             # FastAPI Python backend server
│   │   ├── app/
│   │   │   ├── api/     # Routers (auth, images, analytics, admin)
│   │   │   ├── core/    # Config, logging, and security
│   │   │   ├── models/  # SQLModel schemas
│   │   │   └── services/# Storage and authentication services
│   │   └── static/      # Local upload storage fallback
│   └── web/             # Next.js React frontend
│       ├── src/
│       │   ├── app/     # Pages (login, signup, analytics, dashboard)
│       │   ├── components/# Reusable UI components
│       │   └── lib/     # API helper configurations
└── start.bat            # Quick startup script for local dev
```

---

## ⚙️ Local Development Setup

Follow these steps to run both the frontend and backend servers locally.

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Setup Backend (FastAPI)
1. Navigate to the api directory:
   ```bash
   cd apps/api
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be running at `http://localhost:8000`.

### 2. Setup Frontend (Next.js)
1. Open a new terminal and navigate to the web directory:
   ```bash
   cd apps/web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at `http://localhost:3000`.

---

## 🚀 Deployment Guide

### Frontend (Vercel)
The Next.js app can be deployed seamlessly to [Vercel](https://vercel.com). Make sure to set the environment variable:
- `NEXT_PUBLIC_API_URL`: Your live backend API URL.

### Backend (Render / Railway)
The FastAPI backend can be hosted on a cloud platform like [Render](https://render.com) or [Railway](https://railway.app).
- **Database Connection:** For production persistence, configure your backend to point to a remote PostgreSQL database (like **Supabase**).
- **R2 Storage:** Setup your bucket credentials in the backend configurations to enable permanent, secure cloud storage.
