from beanie import Document
from pydantic import Field
import uuid
from datetime import datetime

class AuditLog(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID | None = None
    action: str  # e.g., task_completed, task_reassigned, company_created
    entity_type: str | None = None  # e.g., task, company
    entity_id: uuid.UUID | None = None
    action_metadata: dict | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "audit_logs"
