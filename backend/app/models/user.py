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
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
