from beanie import Document
from pydantic import Field
import uuid
from datetime import datetime, date

class Task(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    company_id: uuid.UUID
    rule_id: uuid.UUID | None = None
    title: str
    description: str | None = None
    due_date: date
    status: str = "upcoming"  # upcoming, due_soon, overdue, completed
    status_manually_set: bool = False
    assigned_to: uuid.UUID | None = None
    completed_by: uuid.UUID | None = None
    completed_at: datetime | None = None
    reference_doc: str | None = None
    notes: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "tasks"
