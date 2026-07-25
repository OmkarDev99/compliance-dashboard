from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from datetime import date, timedelta

# Monkeypatch to prevent "TypeError: MotorDatabase object is not callable" in beanie init
AsyncIOMotorClient.append_metadata = lambda *args, **kwargs: None

async def init_db():
    # Initialize Motor client
    client = AsyncIOMotorClient(settings.DATABASE_URL, uuidRepresentation="standard")
    
    # Import Beanie Document models to initialize them
    from app.models.user import User
    from app.models.company import Company
    from app.models.compliance_rule import ComplianceRule
    from app.models.task import Task
    from app.models.audit_log import AuditLog
    from app.models.organization import Organization
    from app.models.team import Team
    from app.models.role import Role
    from app.models.compliance_calendar import ComplianceCalendar
    from app.models.task_comment import TaskComment
    
    # Initialize Beanie with models
    database = client.get_default_database()
    await init_beanie(
        database=database,
        document_models=[
            User,
            Company,
            ComplianceRule,
            Task,
            AuditLog, Organization, Team, Role, ComplianceCalendar, TaskComment
        ]
    )

    # Migrate tasks to have a default current_stage
    await Task.get_pymongo_collection().update_many(
        {"current_stage": {"$exists": False}},
        [{"$set": {"current_stage": {"$cond": [{"$eq": ["$status", "completed"]}, "completed", "executive"]}}}]
    )

    # Non-destructive document migration for installations created before tenancy.
    legacy = await Organization.find_one({"slug": "legacy-workspace"})
    if not legacy:
        legacy = Organization(name="Legacy Workspace", slug="legacy-workspace", subscription_plan="legacy")
        await legacy.insert()
    for model in (User, Company, Task, AuditLog, ComplianceRule):
        await model.get_pymongo_collection().update_many({"organization_id": {"$exists": False}}, {"$set": {"organization_id": legacy.id}})
    # Keep pre-existing task assignments readable through the new lifecycle fields.
    await Task.get_pymongo_collection().update_many(
        {"assigned_user_id": {"$exists": False}},
        [{"$set": {"assigned_user_id": "$assigned_to", "assigned_team_id": "$assigned_team", "reviewer_id": "$reviewer", "approver_id": "$approver"}}],
    )

    # Backfill only the new calendar projection for existing clients; tasks remain untouched.
    companies = await Company.find().to_list()
    for company in companies:
        categories = ["cs", "ca"] if company.client_type == "both" else [company.client_type or "cs"]
        rules = await ComplianceRule.find({"is_active": True, "category": {"$in": categories}, "$or": [{"organization_id": company.organization_id}, {"organization_id": None}]}).to_list()
        for rule in rules:
            if company.company_type not in rule.company_types:
                continue
            due_date = company.financial_year_end + timedelta(days=rule.due_days_from_trigger)
            exists = await ComplianceCalendar.find_one({"client_id": company.id, "compliance_rule_id": rule.id, "due_date": due_date})
            if not exists:
                await ComplianceCalendar(organization_id=company.organization_id, client_id=company.id,
                                         compliance_rule_id=rule.id, due_date=due_date,
                                         status="overdue" if due_date < date.today() else "scheduled",
                                         frequency=rule.frequency).insert()

# Placeholder/dummy dependency for routers that still expect a db param
async def get_db():
    yield None
