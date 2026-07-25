from beanie import Document
from pydantic import Field
from datetime import datetime, date
import uuid


class ComplianceCalendar(Document):
    """A scheduled compliance occurrence. It deliberately does not replace Task."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    organization_id: uuid.UUID
    client_id: uuid.UUID
    compliance_rule_id: uuid.UUID
    due_date: date
    status: str = "scheduled"  # scheduled, completed, overdue
    frequency: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "compliance_calendar"
        indexes = ["organization_id", "client_id", [("client_id", 1), ("compliance_rule_id", 1), ("due_date", 1)]]
