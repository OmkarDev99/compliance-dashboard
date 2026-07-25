from beanie import Document
from pydantic import Field
import uuid

class ComplianceRule(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    organization_id: uuid.UUID | None = None  # None means platform/global rule
    form_number: str | None = None
    company_types: list[str]
    frequency: str
    due_days_from_trigger: int
    category: str = "cs"  # cs, ca
    description: str | None = None
    is_active: bool = True

    class Settings:
        name = "compliance_rules"
