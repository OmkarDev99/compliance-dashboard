from pydantic import BaseModel
import uuid

class SummaryReportResponse(BaseModel):
    total_companies: int
    total_tasks: int
    overdue_count: int
    completed_count: int
    due_soon_count: int

class CompanyReportResponse(BaseModel):
    company_id: uuid.UUID
    company_name: str
    compliance_score: float  # completed / total * 100
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int

class UserTasksReport(BaseModel):
    user_id: uuid.UUID
    user_name: str
    total_tasks: int
    completed_tasks: int
    completion_rate: float  # completed / total * 100
