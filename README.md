# CS Compliance Dashboard

An enterprise-grade SaaS web platform for Company Secretaries (CS) to track and process Registrar of Companies (ROC) compliance obligations across multiple client firms.

---

## Technical Architecture

- **Backend:** FastAPI (Python), SQLAlchemy Async ORM, PostgreSQL (via asyncpg), Alembic migrations, and APScheduler background tasks.
- **Frontend:** React + Vite, Tailwind CSS v3, React Router v6, TanStack Query v5 (React Query), Axios HTTP, and Recharts.
- **Local Database:** PostgreSQL.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 16+ (or Docker)

---

### Local Development Setup

#### 1. Setup Backend Database & Run API

Create a PostgreSQL database named `cs_compliance`.

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
# On Windows powershell:
# .\venv\Scripts\Activate.ps1
# On Unix:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database seed script (it automatically creates tables if they do not exist)
python seed.py

# Start the uvicorn development server
uvicorn app.main:app --reload --port 8000
```

*The API will be available at [http://localhost:8000](http://localhost:8000).*
*Access API interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs).*

#### 2. Setup Frontend

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

*The frontend application will run on [http://localhost:5173](http://localhost:5173).*

---

### Seed Login Credentials

- **Administrator:** `admin@csdashboard.com` / `Admin@123`
- **Staff User 1:** `staff1@csdashboard.com` / `Staff@123`
- **Staff User 2:** `staff2@csdashboard.com` / `Staff@123`
- **Partner:** `partner@csdashboard.com` / `Partner@123`

---

### Running via Docker Compose

To spin up the entire stack (PostgreSQL, Backend API, and Frontend) in containerized mode:

```bash
docker-compose up --build
```
