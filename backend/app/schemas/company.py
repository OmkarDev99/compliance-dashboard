from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid

class CompanyBase(BaseModel):
    cin: str = Field(..., min_length=21, max_length=21)  # Corporate Identity Number
    name: str
    company_type: str  # private_limited, public_limited, llp, opc
    reg_date: date
    financial_year_end: date
    address: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    cin: Optional[str] = Field(None, min_length=21, max_length=21)
    name: Optional[str] = None
    company_type: Optional[str] = None
    reg_date: Optional[date] = None
    financial_year_end: Optional[date] = None
    address: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None

class CompanyResponse(BaseModel):
    id: uuid.UUID
    cin: str
    name: str
    company_type: str
    reg_date: date
    financial_year_end: date
    address: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TasksSummary(BaseModel):
    overdue: int = 0
    due_soon: int = 0
    upcoming: int = 0
    completed: int = 0
    total: int = 0

class CompanyDetailResponse(CompanyResponse):
    tasks_summary: TasksSummary

    class Config:
        from_attributes = True
