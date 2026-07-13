# Project Status Report

This document outlines the current state of the **CS Compliance Dashboard** project, highlighting completed features, pending components, and unresolved bugs.

---

## 1. Completed Work

### Backend & Core
- **Database Migration:** Migrated database structure from PostgreSQL to **MongoDB** using **Beanie ODM** (Object Document Mapper) and Motor async driver.
- **Unified Regulatory Library:** Integrated a searchable compliance search engine inside `backend/app/services/regulatory_library.py` that merges scraped JSON updates from multiple regulators.
- **Rule Engine & Scheduler:** Added background task scheduling using **APScheduler** to automatically run compliance checks against assigned client companies.
- **API Endpoints:**
  - `/auth`: Sign-in, sign-up, and JWT-token generation.
  - `/clients` (Companies): Create, read, update, delete, assigned tasks, and audit logs.
  - `/tasks`: Search, assign, complete, and reopen tasks.
  - `/regulatory-updates`: Query and filter scraped updates from the library.
  - `/admin`: User directory and system statistics.

### Web Scraping Services (`backend/app/services/`)
- **MCA Scraper (`mca_scraper.py`):** Crawls the Ministry of Corporate Affairs acts, rules, and e-books.
- **RBI Scraper (`rbi_scraper.py`):** Automatically logs into the RBI portal, strips webdriver signatures, and extracts Master Directions, Circulars, Notifications, Press Releases, and FAQs.
- **Labour Laws Scraper (`labour_scraper.py`):** Crawls the Ministry of Labour & Employment consolidated directory using Playwright in headed mode to collect Labour Codes, Rules, and Notifications.
- **ICSI Scraper:** Scrapes SS-1 through SS-10, Guidance Notes, FAQs, and Amendments.
- **Unified Data Outputs:** Generated and placed standard compliance datasets in `backend/` for search indexing:
  - `mca_scraped_data.json`
  - `rbi_scraped_data.json`
  - `labour_scraped_data.json`
  - `icsi_scrapped_data.json`
  - `atlas_vayana_scraped_data.json`

### Frontend UI (`frontend/`)
- Built a premium, responsive dashboard with Tailwind CSS and React.
- **Modules Completed:**
  - Client Firm Management (ClientList, ClientDetail with assigned tasks & audit logs)
  - Tasks Board (complete/reopen, assignees, and filter status)
  - Regulatory updates search library (with source counts and link attachments)
  - Admin & Partner metrics panel

---

## 2. Pending Work

- **IP India Scraper Integration:** Teammates removed `ipindia_scraped_data.json` from git tracking, and it is currently excluded from the search library. If Intellectual Property (patents, trademarks, and copyright) tracking is still needed for clients, this must be re-added to `DATA_FILES` in `regulatory_library.py`.
- **Secretarial Standards SS-5 to SS-10:** Finalized official texts/PDFs for SS-5 (Minutes) to SS-10 (Board's Report) are currently integrated as draft template definitions. When these are formally updated on the ICSI portal, live PDF parsing should be added.

---

## 3. Remaining Bugs & Issues to Solve

- **Local MongoDB Startup Dependency:**
  - *Bug:* Running the API or database seed script (`seed.py`) locally on a machine without a running MongoDB service on port `27017` causes a `ServerSelectionTimeoutError` crash.
  - *Fix:* Ensure the MongoDB server is started locally, or utilize Docker Compose to launch the database container automatically.
- **Unused Import in App.jsx:**
  - *Issue:* `TaskDetail` is imported as a page route in `frontend/src/App.jsx` but not registered in the `<Routes>` hierarchy (since task details are rendered as interactive drawers directly inside `TaskList.jsx` and `Dashboard.jsx`). The unused import should be cleaned up.

---

## 4. AI Integration & Training Strategy

### Ingestion & Training Pipeline
- **Dataset Utilization:** The scraped JSON datasets (`mca_scraped_data.json`, `rbi_scraped_data.json`, `labour_scraped_data.json`, `icsi_scrapped_data.json`) will serve as the core knowledge base.
- **RAG (Retrieval-Augmented Generation) Architecture:**
  - **Text Chunking:** Chunk the `full_text` and details of regulations into semantic passages (e.g., 500-character chunks with overlap).
  - **Vector Embeddings:** Generate vector representations using a model like `text-embedding-004` or HuggingFace embeddings.
  - **Vector Store Store:** Store the vectors in MongoDB Atlas (using vector search index) or a dedicated vector DB (e.g., Chroma, Pinecone).
  - **Contextual Querying:** When a user queries the dashboard chatbot, retrieve matching passages from the database and feed them into a large language model (e.g., Gemini 1.5 Pro) to generate grounded, audit-ready compliance answers.

### Expected Capabilities from the Integrated AI
- **Compliance QA & Research:** Answer highly complex questions regarding filing requirements, deadline extensions, board meeting notifications, and penal consequences.
- **Draft Form Validation:** Scan pre-filled compliance form drafts (e.g., MGT-7 or AOC-4 files) and check them against current acts or circulars for discrepant terms.
- **Intelligent Alerting:** Automatically summarize new circulars or notifications and tag the specific client firms that are impacted based on their company type and category.

