from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

# Monkeypatch to prevent "TypeError: MotorDatabase object is not callable" in beanie init
AsyncIOMotorClient.append_metadata = lambda *args, **kwargs: None

async def init_db():
    # Initialize Motor client
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    
    # Import Beanie Document models to initialize them
    from app.models.user import User
    from app.models.company import Company
    from app.models.compliance_rule import ComplianceRule
    from app.models.task import Task
    from app.models.audit_log import AuditLog
    
    # Initialize Beanie with models
    database = client.get_default_database()
    await init_beanie(
        database=database,
        document_models=[
            User,
            Company,
            ComplianceRule,
            Task,
            AuditLog
        ]
    )

# Placeholder/dummy dependency for routers that still expect a db param
async def get_db():
    yield None
