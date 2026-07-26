from datetime import date, timedelta
from typing import Literal, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user, require_same_organization
from app.models.company import Company
from app.models.compliance_calendar import ComplianceCalendar
from app.models.compliance_rule import ComplianceRule
from app.models.user import User
from app.schemas.compliance_calendar import ComplianceCalendarResponse

router = APIRouter(prefix="/calendar", tags=["compliance calendar"])

async def _response(item: ComplianceCalendar, organization_id: uuid.UUID) -> ComplianceCalendarResponse:
    rule = await ComplianceRule.get(item.compliance_rule_id)
    if rule and rule.organization_id not in {None, organization_id}:
        rule = None
    return ComplianceCalendarResponse(**item.model_dump(), rule_name=rule.name if rule else "Compliance rule")

def _range_filter(period: Optional[Literal["today", "week", "month", "overdue"]]) -> dict:
    today = date.today()
    if period == "today":
        return {"due_date": today}
    if period == "week":
        return {"due_date": {"$gte": today, "$lte": today + timedelta(days=6)}}
    if period == "month":
        return {"due_date": {"$gte": today, "$lte": today + timedelta(days=30)}}
    if period == "overdue":
        return {"due_date": {"$lt": today}, "status": {"$ne": "completed"}}
    return {}

@router.get("", response_model=list[ComplianceCalendarResponse])
async def list_calendar(
    period: Optional[Literal["today", "week", "month", "overdue"]] = None,
    client_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
):
    query = {"organization_id": current_user.organization_id, **_range_filter(period)}
    if client_id:
        company = await require_same_organization(await Company.get(client_id), current_user)
        query["client_id"] = company.id
    entries = await ComplianceCalendar.find(query).sort("due_date").to_list()
    return [await _response(item, current_user.organization_id) for item in entries]

@router.get("/clients/{client_id}", response_model=list[ComplianceCalendarResponse])
async def client_calendar(client_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    company = await require_same_organization(await Company.get(client_id), current_user)
    entries = await ComplianceCalendar.find({"organization_id": current_user.organization_id, "client_id": company.id}).sort("due_date").to_list()
    return [await _response(item, current_user.organization_id) for item in entries]
