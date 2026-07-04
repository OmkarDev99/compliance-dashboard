# CS Compliance Dashboard (MongoDB Version)

An enterprise-grade SaaS web platform for Company Secretaries (CS) to track and process Registrar of Companies (ROC) compliance obligations across multiple client firms.

---

## Technical Architecture

- **Backend:** FastAPI (Python), Beanie ODM (MongoDB Object Document Mapper), Motor async driver, and APScheduler background tasks.
- **Frontend:** React + Vite, Tailwind CSS v3, React Router v6, TanStack Query v5 (React Query), Axios HTTP, and Recharts.
- **Database:** MongoDB.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- MongoDB Community Server (running locally on port `27017`)

---

### Local Development Setup

#### 1. Setup Backend Database & Run API

Ensure your local MongoDB instance is started and running on the default port (`27017`).

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

# Run database seed script (it automatically connects to MongoDB and initializes collections)
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
