from beanie import Document
from pydantic import Field
from datetime import datetime
import uuid


class Notification(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    organization_id: uuid.UUID
    user_id: uuid.UUID
    task_id: uuid.UUID | None = None
    type: str
    title: str
    message: str
    is_read: bool = False
    is_archived: bool = False
    dedupe_key: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: datetime | None = None

    class Settings:
        name = "notifications"
        indexes = ["organization_id", "user_id", "task_id", "dedupe_key", [("organization_id", 1), ("user_id", 1), ("created_at", -1)]]


class NotificationPreference(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    organization_id: uuid.UUID
    user_id: uuid.UUID
    preferences: dict[str, bool] = Field(default_factory=dict)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notification_preferences"
        indexes = ["organization_id", "user_id", [("organization_id", 1), ("user_id", 1)]]
