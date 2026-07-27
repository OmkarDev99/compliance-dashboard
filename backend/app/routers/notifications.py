from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import uuid
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification, NotificationPreference
from app.schemas.notification import NotificationResponse, NotificationPreferenceUpdate
from app.services.notifications import DEFAULT_PREFERENCES, preferences_for_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=list[NotificationResponse])
async def list_notifications(include_archived: bool = False, limit: int = 50, current_user: User = Depends(get_current_user)):
    query = {"organization_id": current_user.organization_id, "user_id": current_user.id}
    if not include_archived:
        query["is_archived"] = False
    return await Notification.find(query).sort("-created_at").limit(min(limit, 100)).to_list()

@router.get("/preferences")
async def get_preferences(current_user: User = Depends(get_current_user)):
    return await preferences_for_user(current_user.organization_id, current_user.id)

@router.put("/preferences")
async def update_preferences(data: NotificationPreferenceUpdate, current_user: User = Depends(get_current_user)):
    values = {**DEFAULT_PREFERENCES, **data.preferences}
    preference = await NotificationPreference.find_one({"organization_id": current_user.organization_id, "user_id": current_user.id})
    if preference:
        preference.preferences, preference.updated_at = values, datetime.utcnow()
        await preference.save()
    else:
        await NotificationPreference(organization_id=current_user.organization_id, user_id=current_user.id, preferences=values).insert()
    return values

@router.post("/{notification_id}/read")
async def mark_read(notification_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    notification = await Notification.find_one({"_id": notification_id, "organization_id": current_user.organization_id, "user_id": current_user.id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read, notification.read_at = True, datetime.utcnow()
    await notification.save()
    return {"id": str(notification.id), "is_read": True}

@router.post("/{notification_id}/archive")
async def archive_notification(notification_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    notification = await Notification.find_one({"_id": notification_id, "organization_id": current_user.organization_id, "user_id": current_user.id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_archived = True
    await notification.save()
    return {"id": str(notification.id), "is_archived": True}
