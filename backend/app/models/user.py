from beanie import Document
from pydantic import Field
import uuid
from datetime import datetime

class User(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    email: str
    hashed_password: str
    full_name: str | None = None
    role: str = "staff"  # admin, staff, partner
    organization_id: uuid.UUID | None = None
    team_ids: list[uuid.UUID] = Field(default_factory=list)
    role_id: uuid.UUID | None = None
    reports_to: uuid.UUID | None = None
    designation: str | None = None
    permissions: list[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = ["organization_id"]
