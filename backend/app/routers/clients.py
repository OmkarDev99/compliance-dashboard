from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import uuid
from typing import List, Optional
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.models.company import Company
from app.models.task import Task
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, CompanyDetailResponse, TasksSummary
from app.schemas.task import TaskResponse
from app.services.rule_engine import run_rule_engine_for_company

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("", response_model=List[CompanyResponse])
async def get_companies(
    assigned_to: Optional[uuid.UUID] = None,
    is_active: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Company)
    if assigned_to is not None:
        query = query.filter(Company.assigned_to == assigned_to)
    if is_active is not None:
        query = query.filter(Company.is_active == is_active)
    
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_in: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify CIN is unique
    result = await db.execute(select(Company).filter(Company.cin == company_in.cin))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this CIN already exists."
        )
        
    company = Company(**company_in.model_dump())
    db.add(company)
    await db.flush()  # Flush to generate company.id
    
    # Run the rule engine to auto-generate tasks
    await run_rule_engine_for_company(db, company, user_id=current_user.id)
    await db.commit()
    
    return company

@router.get("/{company_id}", response_model=CompanyDetailResponse)
async def get_company_detail(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Company).filter(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    # Count tasks grouped by status for this company
    task_counts_query = select(Task.status, func.count(Task.id)).filter(Task.company_id == company_id).group_by(Task.status)
    task_counts_result = await db.execute(task_counts_query)
    
    counts = {"overdue": 0, "due_soon": 0, "upcoming": 0, "completed": 0, "total": 0}
    for row in task_counts_result.all():
        status_name = row[0]
        cnt = row[1]
        if status_name in counts:
            counts[status_name] = cnt
            counts["total"] += cnt
            
    summary = TasksSummary(**counts)
    
    response_data = CompanyDetailResponse(
        id=company.id,
        cin=company.cin,
        name=company.name,
        company_type=company.company_type,
        reg_date=company.reg_date,
        financial_year_end=company.financial_year_end,
        address=company.address,
        assigned_to=company.assigned_to,
        is_active=company.is_active,
        created_at=company.created_at,
        tasks_summary=summary
    )
    return response_data

@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: uuid.UUID,
    company_in: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Company).filter(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    update_data = company_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
        
    await db.commit()
    await db.refresh(company)
    return company

@router.delete("/{company_id}", response_model=CompanyResponse)
async def delete_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Company).filter(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    company.is_active = False  # Soft delete
    await db.commit()
    await db.refresh(company)
    return company

@router.get("/{company_id}/tasks", response_model=List[TaskResponse])
async def get_company_tasks(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Company).filter(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    tasks_query = select(Task).filter(Task.company_id == company_id).order_by(Task.due_date.asc())
    tasks_result = await db.execute(tasks_query)
    return tasks_result.scalars().all()

from app.schemas.task import AuditLogMinResponse
from sqlalchemy.orm import selectinload
from app.models.audit_log import AuditLog

@router.get("/{company_id}/audit-logs", response_model=List[AuditLogMinResponse])
async def get_company_audit_logs(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify company exists
    result = await db.execute(select(Company).filter(Company.id == company_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Company not found")
        
    # Get company task IDs
    task_ids_query = select(Task.id).filter(Task.company_id == company_id)
    task_ids_result = await db.execute(task_ids_query)
    task_ids = task_ids_result.scalars().all()
    
    # Query direct company logs and task logs
    query = (
        select(AuditLog)
        .filter(
            ((AuditLog.entity_type == "company") & (AuditLog.entity_id == company_id)) |
            ((AuditLog.entity_type == "task") & (AuditLog.entity_id.in_(task_ids) if task_ids else False))
        )
        .options(selectinload(AuditLog.user))
        .order_by(AuditLog.created_at.desc())
    )
    res = await db.execute(query)
    return res.scalars().all()

