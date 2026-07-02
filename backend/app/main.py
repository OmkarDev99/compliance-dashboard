from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.db import engine
from app.db.base import Base
from app.routers import auth, clients, tasks, admin, reports
from app.services.scheduler import start_scheduler, shutdown_scheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created in development
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized successfully.")
    
    # Start APScheduler compliance checker job
    start_scheduler()
    
    yield
    
    # Shutdown: Stop scheduler
    shutdown_scheduler()

app = FastAPI(
    title="CS Compliance Dashboard API",
    description="Backend API for Registrar of Companies compliance workflow management.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:80",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to * for local development flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(tasks.router)
app.include_router(admin.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {"message": "CS Compliance Dashboard API is running."}
