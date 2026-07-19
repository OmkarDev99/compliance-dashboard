from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel
import uuid

class CompanyMinResponse(BaseModel):
    id: uuid.UUID
    name: str
    cin: Optional[str] = None
    company_type: str

    class Config:
        from_attributes = True

class RuleMinResponse(BaseModel):
    id: uuid.UUID
    name: str
    form_number: Optional[str] = None

    class Config:
        from_attributes = True

class UserMinResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    role: str

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: date
    status: str = "upcoming"  # upcoming, due_soon, overdue, completed
    assigned_to: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    reference_doc: Optional[str] = None
    category: str = "cs"  # cs, ca

class TaskCreate(TaskBase):
    company_id: uuid.UUID
    rule_id: Optional[uuid.UUID] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[Literal["upcoming", "due_soon", "overdue", "completed"]] = None
    assigned_to: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    reference_doc: Optional[str] = None
    category: Optional[str] = None

class TaskResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    rule_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    due_date: date
    status: str
    assigned_to: Optional[uuid.UUID] = None
    completed_by: Optional[uuid.UUID] = None
    completed_at: Optional[datetime] = None
    reference_doc: Optional[str] = None
    notes: Optional[str] = None
    category: str = "cs"
    created_at: datetime
    updated_at: datetime
    # Nested objects — populated when using selectinload in the router
    company: Optional[CompanyMinResponse] = None
    assigned_user: Optional[UserMinResponse] = None

    class Config:
        from_attributes = True

class AuditLogMinResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    action_metadata: Optional[dict] = None
    created_at: datetime
    user: Optional[UserMinResponse] = None

    class Config:
        from_attributes = True

class TaskDetailResponse(TaskResponse):
    company: CompanyMinResponse
    rule: Optional[RuleMinResponse] = None
    assigned_user: Optional[UserMinResponse] = None
    completed_user: Optional[UserMinResponse] = None
    audit_logs: List[AuditLogMinResponse] = []

    class Config:
        from_attributes = True
