from beanie import Document
from pydantic import Field
from datetime import datetime
import uuid


class Team(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    organization_id: uuid.UUID
    name: str
    description: str | None = None
    manager_id: uuid.UUID | None = None
    member_ids: list[uuid.UUID] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "teams"
        indexes = ["organization_id", [("organization_id", 1), ("name", 1)]]
