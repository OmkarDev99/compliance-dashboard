from datetime import datetime
import uuid
from app.models.notification import Notification, NotificationPreference

DEFAULT_PREFERENCES = {
    "assignment": True, "reminders": True, "escalations": True,
    "completion": True, "approval": True, "comments": True, "mentions": True,
}


async def create_notification(*, organization_id: uuid.UUID, user_id: uuid.UUID | None,
                              type: str, title: str, message: str, task_id: uuid.UUID | None = None,
                              dedupe_key: str | None = None) -> Notification | None:
    """Create one tenant-local notification, respecting preferences and idempotency."""
    if not user_id:
        return None
    preference = await NotificationPreference.find_one({"organization_id": organization_id, "user_id": user_id})
    enabled = (preference.preferences if preference else DEFAULT_PREFERENCES).get(type, True)
    if not enabled:
        return None
    if dedupe_key:
        existing = await Notification.find_one({"organization_id": organization_id, "user_id": user_id, "dedupe_key": dedupe_key})
        if existing:
            return existing
    notification = Notification(organization_id=organization_id, user_id=user_id, task_id=task_id,
                                type=type, title=title, message=message, dedupe_key=dedupe_key)
    await notification.insert()
    return notification


async def preferences_for_user(organization_id: uuid.UUID, user_id: uuid.UUID) -> dict[str, bool]:
    preference = await NotificationPreference.find_one({"organization_id": organization_id, "user_id": user_id})
    return {**DEFAULT_PREFERENCES, **(preference.preferences if preference else {})}
