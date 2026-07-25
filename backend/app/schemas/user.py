from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
import uuid

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "staff"  # admin, staff, partner
    is_active: bool = True
    organization_id: Optional[uuid.UUID] = None
    team_ids: list[uuid.UUID] = []
    role_id: Optional[uuid.UUID] = None
    reports_to: Optional[uuid.UUID] = None
    designation: Optional[str] = None
    permissions: list[str] = []

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    team_ids: Optional[list[uuid.UUID]] = None
    role_id: Optional[uuid.UUID] = None
    reports_to: Optional[uuid.UUID] = None
    designation: Optional[str] = None
    permissions: Optional[list[str]] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    organization_id: Optional[uuid.UUID] = None
    team_ids: list[uuid.UUID] = []
    role_id: Optional[uuid.UUID] = None
    reports_to: Optional[uuid.UUID] = None
    designation: Optional[str] = None
    permissions: list[str] = []

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
