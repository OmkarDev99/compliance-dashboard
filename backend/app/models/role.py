from beanie import Document
from pydantic import Field
from datetime import datetime
import uuid

DEFAULT_PERMISSIONS = {
    "partner": ["can_view_all_clients", "can_assign_tasks", "can_review_tasks", "can_approve_tasks", "can_manage_users", "can_manage_teams", "can_manage_companies", "can_upload_documents", "can_view_reports", "can_manage_settings"],
    "manager": ["can_view_all_clients", "can_assign_tasks", "can_review_tasks", "can_manage_teams", "can_manage_companies", "can_upload_documents", "can_view_reports"],
    "team_lead": ["can_assign_tasks", "can_review_tasks", "can_upload_documents"],
    "executive": ["can_upload_documents"],
    "intern": ["can_upload_documents"],
    "admin": ["can_view_all_clients", "can_assign_tasks", "can_review_tasks", "can_approve_tasks", "can_manage_users", "can_manage_teams", "can_manage_companies", "can_upload_documents", "can_view_reports", "can_manage_settings"],
}

class Role(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    organization_id: uuid.UUID
    name: str
    permissions: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "roles"
        indexes = ["organization_id", [("organization_id", 1), ("name", 1)]]
