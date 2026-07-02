import uuid
from sqlalchemy import String, Boolean, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    form_number: Mapped[str] = mapped_column(String(50), nullable=True)
    company_types: Mapped[list[str]] = mapped_column(JSON, nullable=False)  # JSON list of applicable company types
    frequency: Mapped[str] = mapped_column(String(50), nullable=False)  # annual, quarterly, monthly, event_based
    due_days_from_trigger: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
