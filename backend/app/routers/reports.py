from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import uuid
from typing import List
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.models.company import Company
from app.models.task import Task
from app.models.user import User
from app.schemas.report import SummaryReportResponse, CompanyReportResponse, UserTasksReport

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/summary", response_model=SummaryReportResponse)
async def get_summary_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total Active Companies
    comp_query = select(func.count(Company.id)).filter(Company.is_active == True)
    comp_result = await db.execute(comp_query)
    total_companies = comp_result.scalar() or 0
    
    # Task Counts
    task_count_query = select(Task.status, func.count(Task.id)).group_by(Task.status)
    task_count_result = await db.execute(task_count_query)
    
    counts = {"overdue": 0, "due_soon": 0, "upcoming": 0, "completed": 0, "total": 0}
    for row in task_count_result.all():
        st = row[0]
        cnt = row[1]
        if st in counts:
            counts[st] = cnt
            counts["total"] += cnt
            
    return {
        "total_companies": total_companies,
        "total_tasks": counts["total"],
        "overdue_count": counts["overdue"],
        "completed_count": counts["completed"],
        "due_soon_count": counts["due_soon"]
    }

@router.get("/company/{company_id}", response_model=CompanyReportResponse)
async def get_company_report(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comp_query = select(Company).filter(Company.id == company_id)
    comp = (await db.execute(comp_query)).scalars().first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
        
    task_query = select(Task.status, func.count(Task.id)).filter(Task.company_id == company_id).group_by(Task.status)
    task_result = await db.execute(task_query)
    
    counts = {"overdue": 0, "due_soon": 0, "upcoming": 0, "completed": 0, "total": 0}
    for row in task_result.all():
        st = row[0]
        cnt = row[1]
        if st in counts:
            counts[st] = cnt
            counts["total"] += cnt
            
    score = (counts["completed"] / counts["total"] * 100) if counts["total"] > 0 else 100.0
    
    return {
        "company_id": company_id,
        "company_name": comp.name,
        "compliance_score": round(score, 1),
        "total_tasks": counts["total"],
        "completed_tasks": counts["completed"],
        "overdue_tasks": counts["overdue"]
    }

@router.get("/team", response_model=List[UserTasksReport])
async def get_team_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users_query = select(User).filter(User.is_active == True)
    users = (await db.execute(users_query)).scalars().all()
    
    reports = []
    for user in users:
        tot_query = select(func.count(Task.id)).filter(Task.assigned_to == user.id)
        tot_cnt = (await db.execute(tot_query)).scalar() or 0
        
        comp_query = select(func.count(Task.id)).filter(Task.assigned_to == user.id, Task.status == "completed")
        comp_cnt = (await db.execute(comp_query)).scalar() or 0
        
        rate = (comp_cnt / tot_cnt * 100) if tot_cnt > 0 else 100.0
        
        reports.append({
            "user_id": user.id,
            "user_name": user.full_name or user.email,
            "total_tasks": tot_cnt,
            "completed_tasks": comp_cnt,
            "completion_rate": round(rate, 1)
        })
        
    return reports

from app.schemas.task import AuditLogMinResponse
from sqlalchemy.orm import selectinload
from app.models.audit_log import AuditLog

@router.get("/audit-logs", response_model=List[AuditLogMinResponse])
async def get_audit_logs(
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(AuditLog)
        .options(selectinload(AuditLog.user))
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/companies", response_model=List[CompanyReportResponse])
async def get_companies_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comp_query = select(Company).filter(Company.is_active == True)
    companies = (await db.execute(comp_query)).scalars().all()
    
    reports = []
    for comp in companies:
        task_query = select(Task.status, func.count(Task.id)).filter(Task.company_id == comp.id).group_by(Task.status)
        task_result = await db.execute(task_query)
        
        counts = {"overdue": 0, "due_soon": 0, "upcoming": 0, "completed": 0, "total": 0}
        for row in task_result.all():
            st = row[0]
            cnt = row[1]
            if st in counts:
                counts[st] = cnt
                counts["total"] += cnt
                
        score = (counts["completed"] / counts["total"] * 100) if counts["total"] > 0 else 100.0
        
        reports.append({
            "company_id": comp.id,
            "company_name": comp.name,
            "compliance_score": round(score, 1),
            "total_tasks": counts["total"],
            "completed_tasks": counts["completed"],
            "overdue_tasks": counts["overdue"]
        })
        
    return reports


