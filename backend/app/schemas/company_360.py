from datetime import date, datetime
from typing import Optional
import uuid

from pydantic import BaseModel

from app.schemas.company import CompanyResponse, TasksSummary
from app.schemas.task import AuditLogMinResponse, UserMinResponse
from app.schemas.compliance_calendar import ComplianceCalendarResponse


class Company360Task(BaseModel):
    id: uuid.UUID
    title: str
    due_date: date
    status: str
    category: str
    display_category: str
    priority: str
    assigned_to: Optional[uuid.UUID] = None
    assigned_user: Optional[UserMinResponse] = None


class CompanyDocument(BaseModel):
    """A task reference document. A dedicated client-document model is not present yet."""
    id: uuid.UUID
    title: str
    category: str
    uploaded_at: datetime
    file_size: Optional[int] = None
    download_url: str


class CompanyContact(BaseModel):
    id: uuid.UUID
    name: str
    designation: str
    din_pan: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None


class ClientAssignmentSummary(BaseModel):
    relationship_partner: Optional[UserMinResponse] = None
    manager: Optional[UserMinResponse] = None
    team_id: Optional[uuid.UUID] = None
    team_name: Optional[str] = None
    primary_executive: Optional[UserMinResponse] = None


class Company360ViewResponse(BaseModel):
    company: CompanyResponse
    industry: Optional[str] = None
    tasks_summary: TasksSummary
    tasks: list[Company360Task]
    documents: list[CompanyDocument]
    contacts: list[CompanyContact]
    audit_logs: list[AuditLogMinResponse]
    assignment: ClientAssignmentSummary
    calendar: list[ComplianceCalendarResponse]
