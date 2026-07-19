from beanie import Document
from pydantic import Field
import uuid
from datetime import datetime, date

class Company(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    cin: str | None = None
    name: str
    company_type: str  # private_limited, public_limited, llp, opc, partnership, proprietorship, individual
    reg_date: date
    financial_year_end: date
    address: str | None = None
    assigned_to: uuid.UUID | None = None
    pan: str | None = None
    gstin: str | None = None
    client_type: str = "cs"  # cs, ca, both
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "companies"
