import uuid
from datetime import datetime, date
from sqlalchemy import String, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cin: Mapped[str] = mapped_column(String(21), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_type: Mapped[str] = mapped_column(String(50), nullable=False)  # private_limited, public_limited, llp, opc
    reg_date: Mapped[date] = mapped_column(Date, nullable=False)
    financial_year_end: Mapped[date] = mapped_column(Date, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=True)
    assigned_to: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    assigned_user = relationship("User", foreign_keys=[assigned_to])
