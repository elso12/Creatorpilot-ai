# CreatorPilot AI — Autonomous YouTube Intelligence & Production Suite

> **AI-powered competitive intelligence, empirical outlier scoring, and generative production planning for YouTube creators and video strategists.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4+-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-8E75C4?style=flat&logo=google&logoColor=white)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph Frontend["Next.js 16 App Router (Client & Server)"]
        Dash["/ Executive Dashboard"]
        Res["/research Research Engine"]
        Comp["/competitors Outlier Intelligence"]
        AI["/ai-studio Content Studio"]
        Plan["/planner Kanban Workspace"]
        Diag["/settings System Diagnostics"]
    end

    subgraph Backend["FastAPI REST API Engine (Python 3.13)"]
        R_Res["/api/v1/research"]
        R_Comp["/api/v1/competitors"]
        R_AI["/api/v1/ai"]
        R_Plan["/api/v1/planner"]
        R_Dash["/api/v1/dashboard & /settings"]
        
        Score["Opportunity Scoring Engine\n(Mathematical Outlier Weights)"]
        AIClient["AIStudioClient\n(Google GenAI SDK & Gemini 2.0 Flash)"]
        YTClient["YouTubeClient\n(Batching & Quota Fallback)"]
    end

    subgraph Database["PostgreSQL (Relational Store)"]
        T_Chan[("channels")]
        T_Vid[("videos")]
        T_Snap[("video_snapshots")]
        T_Idea[("content_ideas")]
    end

    subgraph External["External APIs"]
        YTApi["YouTube Data API v3"]
        GeminiApi["Google Gemini 2.0 Flash"]
    end

    Frontend -->|HTTP / REST JSON| Backend
    R_Comp --> Score
    R_AI --> AIClient
    R_Res --> YTClient
    R_Comp --> YTClient
    
    YTClient -.->|API Call / Mock Fallback| YTApi
    AIClient -.->|Schema Enforced / Mock Fallback| GeminiApi

    Backend -->|SQLAlchemy 2.0 / psycopg3| Database
```

---

## 2. Core Features & Scientific Methodology

### Feature A: Video Research & Intelligence Repository
- **Query & Filter**: Search YouTube videos by keyword, sort by relevance, views, or publication date, and filter by duration (Shorts, Medium, Long-form).
- **Persistent Repository**: Save high-performing videos directly to PostgreSQL with channel relationships and metadata snapshots for grounding AI ideation.

### Feature B: Competitor Baselines & Metric Snapshots
- **Creator Watchlist**: Add competitor creators by handle (e.g. `@Fireship`) or YouTube channel ID.
- **Baseline Medians**: Ingests recent uploads and computes channel median views to eliminate single-hit skew.
- **Metric Delta Tracking**: Record historical snapshots over time to calculate view growth velocity ($\Delta \text{views}$) between recording intervals.

### Feature C: Mathematical Opportunity Scoring Engine
Videos are dynamically ranked from **0 to 100** using an empirical composite formula:

$$\text{Performance Ratio} = \frac{\text{Video Views}}{\max(\text{Channel Median Views}, 1)}$$

$$\text{Velocity} = \frac{\text{Video Views}}{\max(\text{Days Since Published}, 1)}$$

$$\text{Engagement Rate} = \frac{\text{Likes} + \text{Comments}}{\max(\text{Video Views}, 1)} \times 100\%$$

#### Transparent Weighting:
1. **Outlier Pull (40% weight)**: Normalized against channel baselines ($1.0\times = 40$ pts, $\ge 3.0\times = 100$ pts).
2. **View Velocity (30% weight)**: Normalized vs. expected channel cadence.
3. **Engagement Benchmark (20% weight)**: Normalized against the $4.0\%$ industry benchmark.
4. **Small Channel Bonus (10% weight)**: Awarded if subscribers $< 50,000$ and performance ratio $> 1.5\times$ to spotlight viral underdog breakouts.
5. **Classifications**:
   - $\ge 80$: **Breakout Outlier**
   - $60 - 79$: **Above Average**
   - $40 - 59$: **Average**
   - $< 40$: **Underperforming**

### Feature D & E: AI Content Studio & Market Research Reports
- **5 Psychological Title Architectures**:
  - *Curiosity Gap*
  - *Contrarian / Hot Take*
  - *High Stakes / Transformation*
  - *Clear Value / How-To*
- **3 Retention Hooks**: 15-second script wording with visual action cues and pacing advice.
- **Production Briefs**: Chronological narrative outline with target timestamps and 2 punchy thumbnail briefs (maximum 3–4 word overlay text).
- **Market Intelligence Synthesis**: Aggregates analyzed videos into executive summaries, observed audience patterns, underserved content gaps, fatigue risks, and 3 testable video experiments with quantifiable success metrics.

### Feature F: Kanban Production Planning Workspace
- Interactive 5-stage board: **Ideas** $\rightarrow$ **Researching** $\rightarrow$ **Ready to Record** $\rightarrow$ **Published** $\rightarrow$ **Reviewed**.
- Search, format filtering (Shorts vs. Long-form), favorites bookmarking, and detail editing drawer with one-click hook/outline copying.

### Feature G & I: Executive Cockpit & Provider Diagnostics
- Unified dashboard with pipeline metrics, system status indicator, top breakout outlier alerts, and recent research feeds.
- Live PostgreSQL latency diagnostic test and provider configuration monitor.

---

## 3. Technology Stack

| Layer | Technology | Key Highlights |
| :--- | :--- | :--- |
| **Backend Framework** | **FastAPI (Python 3.13)** | Async ASGI server, Pydantic v2 schemas, type safety |
| **ORM & Database** | **SQLAlchemy 2.0 & PostgreSQL** | `psycopg3` driver, cascade deletes, foreign keys, migrations |
| **AI Synthesis** | **Google Gemini 2.0 Flash** | `google-genai` SDK, structured JSON schema enforcement |
| **Video API** | **YouTube Data API v3** | `httpx` async client, batch statistics, mock simulation fallback |
| **Frontend Framework** | **Next.js 16 (App Router)** | React 19, TypeScript, client components, Turbopack |
| **UI & Styling** | **Tailwind CSS v4 & Lucide** | Glassmorphism, dark obsidian palette, Sonner notifications |
| **Testing** | **Pytest** | 12 automated unit & integration tests (`TestClient`) |

---

## 4. Local Setup Guide

### Prerequisites
- **Python 3.11+** (Python 3.13 recommended)
- **Node.js 18+** & **npm**
- **PostgreSQL 14+** (running locally on port 5432)

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/your-username/creatorpilot-ai.git
cd creatorpilot-ai
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/creatorpilot
PROJECT_NAME="CreatorPilot AI"
ENVIRONMENT=development
DEBUG=true

# Optional: Add your keys for live API mode (defaults to offline simulation if blank)
YOUTUBE_API_KEY=
GEMINI_API_KEY=
```

### Step 2: Initialize Database
Create the database in PostgreSQL:
```sql
CREATE DATABASE creatorpilot;
```

### Step 3: Setup Backend Virtual Environment
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt # or pip install dependencies
```

### Step 4: Run Database Migrations / Initialize Tables
```bash
# Verify connection & initialize tables:
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine); print('Database initialized!')"
```

### Step 5: Start Servers

#### Terminal 1 — FastAPI Backend:
```bash
cd backend
.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```
- API Root: [http://localhost:8000](http://localhost:8000)
- Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Terminal 2 — Next.js Frontend:
```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

---

## 5. Automated Testing Suite

Run the full backend test suite covering opportunity scoring mathematics, competitor snapshots, search parsing, AI studio synthesis, and planner CRUD operations:

```bash
backend\.venv\Scripts\pytest.exe backend/tests/ -v
```

Expected output:
```text
============================= test session starts =============================
backend/tests/test_ai.py::test_ai_content_pack_generation PASSED         [  8%]
backend/tests/test_ai.py::test_ai_research_report_synthesis PASSED       [ 16%]
backend/tests/test_ai.py::test_ai_save_idea_pipeline PASSED              [ 25%]
backend/tests/test_competitors.py::test_opportunity_scoring_engine_math PASSED [ 33%]
backend/tests/test_competitors.py::test_competitor_lifecycle_and_snapshots PASSED [ 41%]
backend/tests/test_planner_and_dashboard.py::test_planner_crud_lifecycle PASSED [ 50%]
backend/tests/test_planner_and_dashboard.py::test_dashboard_overview PASSED [ 58%]
backend/tests/test_planner_and_dashboard.py::test_settings_diagnostics PASSED [ 66%]
backend/tests/test_research.py::test_iso8601_duration_parser PASSED      [ 75%]
backend/tests/test_research.py::test_search_endpoint_returns_200_and_items PASSED [ 83%]
backend/tests/test_research.py::test_search_with_duration_filter PASSED  [ 91%]
backend/tests/test_research.py::test_save_and_retrieve_video_flow PASSED [100%]
======================= 12 passed, 1 warning in 8.62s =========================
```

Verify Next.js production build:
```bash
cd frontend
npm run build
```

---

## 6. Engineering & Production Highlights

- **Dual-Mode Reliability (Zero API Cost Guarantee)**: Both the YouTube and Gemini integrations feature graceful fallbacks to high-fidelity mock generators. The platform is 100% demoable offline without API keys or token expenditure.
- **API Quota Management**: In live YouTube mode, video queries batch up to 50 items per call (`videos.list` with comma-separated IDs) to minimize Google quota consumption (1 unit vs. 50 individual calls).
- **Strict JSON Schema Enforcement**: Gemini calls utilize `response_schema` and `response_mime_type="application/json"` to guarantee deterministic structure conforming to Pydantic and TypeScript types.
- **Relational Integrity**: Complete database cascading deletes on channels ensure child videos and snapshots are safely removed without orphaned records.
