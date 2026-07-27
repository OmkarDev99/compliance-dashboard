from datetime import datetime
from pydantic import BaseModel
import uuid


class NotificationResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID | None = None
    type: str
    title: str
    message: str
    is_read: bool
    is_archived: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    preferences: dict[str, bool]
