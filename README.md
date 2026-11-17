# FixTrail – Smart IT Problem Solver 🛠️⚡

**FixTrail** is a modern, professional, AI-powered web application designed to help developers, systems administrators, and IT support specialists diagnose and resolve complex technical errors.

Users can upload screenshots of error popups, BSOD crashes, or terminal stack traces, describe their symptoms, and instantly receive intelligent, step-by-step troubleshooting roadmaps with copyable terminal commands, verification scripts, and root-cause explanations.

---

## 🌟 Key Features

1. **User Registration & JWT Authentication**:
   - Secure account registration, BCrypt password hashing, and role-based access control (`user` and `admin`).
   - 1-Click instant demo logins:
     - **Demo User**: `user@fixtrail.ai` / `User@123`
     - **Admin Portal**: `admin@fixtrail.ai` / `Admin@123`

2. **AI-Powered Screenshot Error Detection**:
   - Multimodal OCR error detection using Google Gemini 1.5 / 2.0 API.
   - Drag-and-drop or **`Ctrl + V` clipboard paste** directly from screenshots.
   - Built-in sample scenarios for instant 1-click test diagnosis (Windows BSOD, Docker Daemon offline, Node EADDRINUSE Port 3000, React CORS blocked, MySQL 2003).

3. **Intelligent Step-by-Step Troubleshooting**:
   - Structured resolution roadmap with action instructions, bash/PowerShell commands, and root-cause breakdowns.
   - 1-Click Copy-to-Clipboard for terminal snippets.
   - Interactive step completion checklist with progress tracking.
   - Verification commands and preventative best practice advice.
   - "Mark as Solved" with celebratory confetti (`canvas-confetti`)!
   - Export solution as Markdown guide or PDF.

4. **Similar Issue Detection**:
   - Intelligent text similarity engine cross-referencing new errors against previously solved tickets and the Knowledge Base.
   - Surfaces percentage match score (e.g. `94% Match`) and instant quick-fix previews.

5. **Personal Problem-Solving History**:
   - Comprehensive dashboard of all your past technical issues.
   - Filter by status (`Solved`, `In Progress`, `Open`), category, and search keywords.
   - Add personal resolution notes and rate solution quality (1–5 stars).
   - "Publish to Knowledge Base" button to share verified fixes with the community.

6. **Admin Dashboard with Issue Analytics**:
   - Executive KPIs: Total tickets, resolution velocity (%), average AI diagnostic confidence, active users.
   - Category distribution visual bars (Networking, Database, DevOps, OS, Web).
   - Severity breakdown and 7-day intake vs. resolution volume charts.
   - Organization ticket management table (change status, inspect, delete).

7. **Curated Knowledge Base**:
   - Searchable, categorized repository of verified IT solutions.
   - Live "Was this helpful?" upvote counters.
   - Modal to contribute new community-verified troubleshooting guides.

8. **Modern Responsive UI with Dark/Light Mode**:
   - Cyber glassmorphism design with Tailwind CSS, sleek icons, and smooth transitions.
   - Persistent Dark / Light theme toggle.

9. **Modular Spline 3D Hero Section**:
   - **Spline 3D Active by Default**: Renders your live 3D scene (`https://prod.spline.design/sCbspRJLWPB-atm7/scene.splinecode`) powered by `@splinetool/react-spline` and WebGL runtime.
   - Includes interactive hover/click rotation, zoom, loading state indicator, and quick "3D Controls" to switch between custom Spline URLs or the 3D Canvas Diagnostics Core.

---

## 🏗️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React.js 18 + Vite | Fast component architecture, Lucide icons, Canvas Confetti |
| **Styling** | Tailwind CSS | Dark/Light mode, custom cyber theme, glassmorphism |
| **3D Element** | HTML5 Canvas / Spline | Interactive 3D Holographic Core + Spline 3D Embed slot |
| **Backend API** | Python FastAPI | High-performance asynchronous REST API, Uvicorn |
| **Database** | MySQL / SQLAlchemy | MySQL relational backend with zero-config SQLite auto-fallback |
| **AI Vision Engine** | Google Gemini API | Multimodal vision & reasoning (`gemini-1.5-flash` / `gemini-2.0-flash`) |

---

## 🚀 Quick Start Guide

### 1. 1-Click Startup (Windows)
Double-click **`run_app.bat`** in the project root:
- Automatically starts the FastAPI backend server on `http://localhost:8000`
- Automatically starts the React Vite frontend on `http://localhost:5173`

### 2. Manual Startup

#### Backend Setup
```bash
# 1. Activate Python virtual environment
cd "backend"
..\backend\venv\Scripts\activate

# 2. (Optional) Configure MySQL in .env or use auto-fallback
# If MySQL is running, it connects automatically. If not, it uses SQLite seamlessly!

# 3. Seed database
python -m backend.init_db

# 4. Start Uvicorn Server
python -m uvicorn backend.app.main:app --port 8000 --reload
```
API Documentation is available at: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Frontend Setup
```bash
# 1. Open a new terminal in frontend
cd "frontend"

# 2. Run dev server
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 🔑 AI Engine & Gemini API Configuration

1. **In the Web UI**: Click the **"AI Engine"** button in the top navigation bar to enter your Gemini API key or view database telemetry.
2. **Via `.env`**: Set `GEMINI_API_KEY=your_key_here` in `backend/.env`.
3. **Get Free Gemini API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)
4. *Note*: FixTrail includes a built-in expert IT heuristic engine that works immediately even without an external API key!

---

## 🎨 Integrating Custom Spline 3D Scene

To add your own custom Spline 3D element:
1. In the Web UI Hero section, click the **"3D Mode"** button in the top-right corner of the 3D container.
2. Toggle **"Enable Custom Spline 3D"** and paste your Spline public export URL (e.g. `https://my.spline.design/your-scene/...`).
3. Alternatively, pass `customSplineUrl="..."` prop to `<Hero3D />` in `frontend/src/pages/HomePage.jsx`.

---

## 👥 Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@fixtrail.ai` | `Admin@123` | Full access + Admin Analytics Dashboard |
| **Standard User** | `user@fixtrail.ai` | `User@123` | Solve errors + Personal History + Knowledge Base |
