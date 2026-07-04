from beanie import Document
from pydantic import Field
import uuid
from datetime import datetime, date

class Company(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    cin: str
    name: str
    company_type: str  # private_limited, public_limited, llp, opc
    reg_date: date
    financial_year_end: date
    address: str | None = None
    assigned_to: uuid.UUID | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "companies"
