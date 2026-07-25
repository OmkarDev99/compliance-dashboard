from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
import uuid


class ComplianceCalendarResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    compliance_rule_id: uuid.UUID
    rule_name: Optional[str] = None
    due_date: date
    status: str
    frequency: str
    created_at: datetime

    class Config:
        from_attributes = True
