# Mindora AI — Autonomous Study Mentor & Learning Operating System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-35%2F35%20Passing-brightgreen.svg)]()

> **Mindora AI** is an intelligent, autonomous study companion and learning operating system engineered to take engineering and college students through an 8-stage mastery cycle. Built with a distinctive **Aurora Study Nebula** visual identity, secure dual-token authentication, persistent time tracking, and an interactive Socratic AI tutor.

---

## 🌌 Visual Identity: Aurora Study Nebula

Mindora AI rejects generic corporate SaaS aesthetics in favour of an immersive, focused study environment inspired by the deep night sky and auroral glows:

* **Midnight Indigo** (`#1E1B4B`): Deep primary dark canvas.
* **Royal Indigo** (`#3730A3`): Structured navigation and header backdrops.
* **Electric Violet** (`#7C3AED`): Primary call-to-actions, focus accents.
* **Neon Orchid** (`#D946EF`): Interactive highlights and streak celebrations.
* **Aurora Cyan** (`#22D3EE`): Informational chips, focused active timer rings.
* **Aurora Mint** (`#34D399`): Subject mastery badges and completed states.
* **Solar Amber** (`#FBBF24`): Revision alerts and streak milestones.
* **Coral Pulse** (`#FB7185`): Diagnostic weak topics requiring review.

### Signature Interface Elements
1. **Live Header Clock**: Real-time tick update displaying hours, minutes, seconds, current day, date, and local timezone across the entire application.
2. **Global Pomodoro Focus Studio & Mini-Timer**: Synchronized timer supporting standard Pomodoro (25/5), Deep Work (50/10), Short Burst (15/3), or Open Stopwatch. Automatically docks into a floating mini-timer widget when navigating away to let students study anywhere.

---

## 🔄 The 8-Stage Learning Cycle

Mindora AI structures student learning into an evidence-based pedagogical cycle:

```
  [1. Goal Setting] ──> [2. Diagnostic Assessment] ──> [3. Adaptive Roadmap]
          │                                                    │
  [8. Mastery & Analytics]                                     ▼
          ▲                                           [4. Active Focus Studio]
          │                                                    │
  [7. Spaced Practice] <── [6. AI Socratic Mentor] <── [5. Resource Discovery]
```

1. **Goal Setting & Curriculum Target**: Students declare target examinations (e.g., GATE, University Semester Exams), deadlines, and weekly study hour budgets.
2. **Diagnostic Knowledge Graph**: Categorizes topics into `unassessed`, `weak`, `inProgress`, and `mastered` with prerequisite dependency mappings.
3. **Adaptive Study Roadmapping**: Sequenced milestones with realistic time budgets and foundational prerequisites.
4. **Active Focus Studio**: Pomodoro timer tied directly to active curriculum topics, recording actual study time against planned goals.
5. **Intelligent Multimodal Resources**: Curated university-level lecture playlists, MIT OCW, NPTEL, and textbooks matched to student needs.
6. **Socratic AI Study Mentor**: Conversational tutor supporting formatted Markdown, KaTeX mathematical notation ($\LaTeX$), syntax-highlighted code with copy buttons, and an inline safe arithmetic calculator.
7. **Active Recall & Practice**: Socratic questions prompting students to explain concepts rather than passively receiving answers.
8. **Mastery Analytics Dashboard**: Live visual tracking of weekly targets, subject-by-subject mastery percentages, and study session histories.

---

## 🏛️ System Architecture & Tech Stack

### Frontend Client
* **Framework**: React 18 with TypeScript and Vite
* **Styling**: Tailwind CSS with custom Aurora design tokens and gradients
* **Typography & Math**: KaTeX (`katex`, `rehype-katex`, `remark-math`) for LaTeX equations
* **Icons**: Lucide React
* **Testing**: Vitest + React Testing Library + JSDOM

### Backend Server
* **Framework**: FastAPI (Python 3.10+) with Uvicorn ASGI server
* **Database**: SQLite with Write-Ahead Logging (`WAL` mode) and schema migrations
* **Security & Auth**:
  * Password hashing via Argon2id (`argon2-cffi`)
  * Dual-token authentication: short-lived Access Token (15 min) + rotating Refresh Token (7 days)
  * `httpOnly`, `SameSite=Lax` cookies with Double Submit CSRF mitigation
  * Per-IP and per-account brute-force rate limiting (exponential lockout)
* **AI Engine**: Anthropic Claude 3.5 Sonnet with streaming Server-Sent Events (SSE) and an intelligent offline educational fallback tutor
* **Testing**: Pytest with HTTPX TestClient

---

## 🚀 Quickstart Guide

### Prerequisites
* **Python 3.10+** (Python 3.12 or 3.14 supported)
* **Node.js 18+** & **npm**

### 1. Repository Setup & Environment

Clone the repository and prepare your environment configuration:

```bash
git clone https://github.com/<your-username>/mindora-ai-study-mentor.git
cd mindora-ai-study-mentor

# Copy example environment configuration
cp .env.example .env
```

Review `.env` and configure your settings:
```ini
ENVIRONMENT=development
PORT=5000
DATABASE_URL=sqlite:///./mindora.db
JWT_SECRET=your_super_secret_key_change_in_production
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ANTHROPIC_API_KEY=your_key_here  # Optional: Fallback tutor active if omitted
```

### 2. Install Dependencies

```bash
# Python Backend Dependencies
pip install fastapi uvicorn argon2-cffi python-jose[cryptography] pydantic httpx pytest

# React Client Dependencies
npm --prefix client install
```

### 3. Launch Development Servers

You can launch both services using the provided root helper scripts:

#### Option A: Quick Scripts (Windows PowerShell)
```powershell
# In Terminal 1 (Backend):
.\start-server.ps1

# In Terminal 2 (Frontend):
.\start-client.ps1
```

#### Option B: Manual Execution
```bash
# Terminal 1 — Backend (http://localhost:5000):
python -m uvicorn backend.app.main:app --port 5000 --reload

# Terminal 2 — Frontend (http://localhost:5173):
npm --prefix client run dev
```

Visit **`http://localhost:5173`** in your browser. The backend API documentation is available at **`http://localhost:5000/docs`**.

---

## 🧪 Testing

Mindora AI features an automated test suite verifying both backend endpoints and frontend user interface behaviors.

To run the entire test suite:
```bash
# Using npm
npm test

# Or using the PowerShell runner
.\run-tests.ps1
```

### Granular Testing
```bash
# Backend pytest suite (17 tests)
npm run test:backend
# or: python -m pytest backend/tests

# Frontend Vitest suite (18 tests)
npm run test:client
# or: npm --prefix client test
```

**Test Status**: `35/35 Passing (100%)`

---

## 📋 Project Status & Verification Checklist

| Component | Status | Details |
|---|---|---|
| **Aurora Design System** | ✅ Production Ready | Tokens, gradients, WCAG AA contrast, responsive layout |
| **Live Clock & Timer** | ✅ Production Ready | Real-time seconds tick, synchronized Pomodoro studio & floating mini-timer |
| **Authentication System** | ✅ Production Ready | Argon2id hashing, rotating refresh tokens, httpOnly cookies, CSRF protection |
| **AI Study Mentor** | ✅ Production Ready | Streaming SSE responses, KaTeX math formatting, code copy button, safe calculator |
| **Curriculum & Goals** | ✅ Production Ready | SQLite persistence for learning goals, topics, and focus sessions |
| **Password Reset** | ℹ️ Prototype Mode | Password reset token generated and logged to server terminal console for development testing |
| **Video Resources** | ℹ️ Prototype Mode | Curated list of high-yield MIT & NPTEL video lectures without requiring paid YouTube API quota |

---

## 🎓 Academic Context & Attribution

This project was conceived and developed as part of the academic curriculum at:

* **Institution**: Coimbatore Institute of Technology (CIT), Coimbatore, India
* **Department**: Department of Artificial Intelligence and Data Science
* **Course**: Software Engineering Laboratory (Course Code: `22MDCL4`)
* **Semester**: 5th Semester

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

