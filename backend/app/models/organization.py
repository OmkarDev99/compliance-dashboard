from beanie import Document
from pydantic import Field
from datetime import datetime
import uuid


class Organization(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    slug: str
    logo: str | None = None
    email: str | None = None
    phone: str | None = None
    subscription_plan: str = "starter"
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "organizations"
        indexes = ["slug"]
