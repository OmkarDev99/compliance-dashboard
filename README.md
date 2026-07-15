# CS Compliance Dashboard

An enterprise-grade SaaS platform for Company Secretaries (CS) to track and manage Registrar of Companies (ROC) compliance obligations across multiple client firms — with an integrated AI chatbot for querying compliance notices in natural language.

---

## Services

This project consists of three independently run services:

| Service | Stack | Port | Purpose |
|---|---|---|---|
| **Backend API** | FastAPI, Beanie ODM, Motor, APScheduler | `8000` | Core compliance tracking, client management, scheduling |
| **Frontend** | React, Vite, Tailwind CSS, TanStack Query | `5173` | Dashboard UI |
| **AI Chatbot API** | FastAPI, ChromaDB, Gemini API | `8001` | RAG-based Q&A over scraped ICSI/MCA compliance notices |

Database: **MongoDB** (shared by the backend; the AI module maintains its own vector index derived from the same scraped data).

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB Community Server, running locally on port `27017`
- A Gemini API key for the AI module — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

---

## Setup

Each service is set up the same general way: create a virtual environment (Python services), install dependencies, and run. Details below.

### 1. Backend API

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed.py                  # initializes MongoDB collections
uvicorn app.main:app --reload --port 8000
\`\`\`

Runs at [localhost:8000](http://localhost:8000) · Interactive docs at [localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Runs at [localhost:5173](http://localhost:5173)

### 3. AI Chatbot API

\`\`\`bash
cd ai_module
python3 -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
echo "GEMINI_API_KEY=your_key_here" > .env

# Build the vector index (one-time; re-run when scraped data changes)
python load_and_chunk.py
python embed_and_store.py

uvicorn main:app --reload --port 8001
\`\`\`

Runs at [localhost:8001](http://localhost:8001) · Interactive docs at [localhost:8001/docs](http://localhost:8001/docs)

Full architecture, module breakdown, and re-indexing details: [\`ai_module/README.md\`](./ai_module/README.md)

---

## AI Chatbot — Quick Reference

\`\`\`bash
curl -X POST http://localhost:8001/chat \\
  -H "Content-Type: application/json" \\
  -d '{"question": "What is the procedure for transfer of interest of a member in a company not having share capital?"}'
\`\`\`

\`\`\`json
{
  "answer": "string",
  "sources": [{ "title": "string", "source": "string", "url": "string", "date": "string" }],
  "confidence": "answered | not_found"
}
\`\`\`

---

## Seed Login Credentials

| Role | Email | Password |
|---|---|---|
| Administrator | \`admin@csdashboard.com\` | \`Admin@123\` |
| Staff User 1 | \`staff1@csdashboard.com\` | \`Staff@123\` |
| Staff User 2 | \`staff2@csdashboard.com\` | \`Staff@123\` |
| Partner | \`partner@csdashboard.com\` | \`Partner@123\` |
