from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from typing import List, Optional
from app.core.dependencies import get_current_user
from app.models.company import Company
from app.models.task import Task
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, CompanyDetailResponse, TasksSummary
from app.schemas.task import TaskResponse, CompanyMinResponse, UserMinResponse, AuditLogMinResponse
from app.services.rule_engine import run_rule_engine_for_company

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("", response_model=List[CompanyResponse])
async def get_companies(
    assigned_to: Optional[uuid.UUID] = None,
    is_active: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if assigned_to is not None:
        query["assigned_to"] = assigned_to
    if is_active is not None:
        query["is_active"] = is_active
        
    companies = await Company.find(query).skip(offset).limit(limit).to_list()
    return companies

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_in: CompanyCreate,
    current_user: User = Depends(get_current_user)
):
    existing = await Company.find_one({"cin": company_in.cin})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this CIN already exists."
        )
        
    company = Company(**company_in.model_dump())
    await company.insert()
    
    # Run the rule engine to auto-generate tasks
    await run_rule_engine_for_company(None, company, user_id=current_user.id)
    
    return company

@router.get("/{company_id}", response_model=CompanyDetailResponse)
async def get_company_detail(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    company = await Company.get(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    # Count tasks grouped by status for this company
    tasks = await Task.find({"company_id": company_id}).to_list()
    
    counts = {"overdue": 0, "due_soon": 0, "upcoming": 0, "completed": 0, "total": 0}
    for t in tasks:
        status_name = t.status
        if status_name in counts:
            counts[status_name] += 1
            counts["total"] += 1
            
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
    current_user: User = Depends(get_current_user)
):
    company = await Company.get(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    update_data = company_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
        
    await company.save()
    return company

@router.delete("/{company_id}", response_model=CompanyResponse)
async def delete_company(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    company = await Company.get(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    company.is_active = False  # Soft delete
    await company.save()
    return company

@router.get("/{company_id}/tasks", response_model=List[TaskResponse])
async def get_company_tasks(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    company = await Company.get(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    tasks = await Task.find({"company_id": company_id}).sort("due_date").to_list()
    
    # Resolve related fields manually
    response_tasks = []
    user_cache = {}
    
    for t in tasks:
        assigned_user = None
        if t.assigned_to:
            if t.assigned_to not in user_cache:
                u = await User.get(t.assigned_to)
                if u:
                    user_cache[t.assigned_to] = UserMinResponse(
                        id=u.id, email=u.email, full_name=u.full_name, role=u.role
                    )
                else:
                    user_cache[t.assigned_to] = None
            assigned_user = user_cache[t.assigned_to]
            
        company_min = CompanyMinResponse(
            id=company.id, name=company.name, cin=company.cin, company_type=company.company_type
        )
        
        response_tasks.append(
            TaskResponse(
                id=t.id,
                company_id=t.company_id,
                rule_id=t.rule_id,
                title=t.title,
                description=t.description,
                due_date=t.due_date,
                status=t.status,
                assigned_to=t.assigned_to,
                completed_by=t.completed_by,
                completed_at=t.completed_at,
                reference_doc=t.reference_doc,
                notes=t.notes,
                created_at=t.created_at,
                updated_at=t.updated_at,
                company=company_min,
                assigned_user=assigned_user
            )
        )
    return response_tasks

@router.get("/{company_id}/audit-logs", response_model=List[AuditLogMinResponse])
async def get_company_audit_logs(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    company = await Company.get(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    tasks = await Task.find({"company_id": company_id}).to_list()
    task_ids = [t.id for t in tasks]
    
    logs = await AuditLog.find({
        "$or": [
            {"entity_type": "company", "entity_id": company_id},
            {"entity_type": "task", "entity_id": {"$in": task_ids}}
        ]
    }).sort("-created_at").to_list()
    
    response_logs = []
    user_cache = {}
    
    for log in logs:
        log_user = None
        if log.user_id:
            if log.user_id not in user_cache:
                u = await User.get(log.user_id)
                if u:
                    user_cache[log.user_id] = UserMinResponse(
                        id=u.id, email=u.email, full_name=u.full_name, role=u.role
                    )
                else:
                    user_cache[log.user_id] = None
            log_user = user_cache[log.user_id]
            
        response_logs.append(
            AuditLogMinResponse(
                id=log.id,
                user_id=log.user_id,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                action_metadata=log.action_metadata,
                created_at=log.created_at,
                user=log_user
            )
        )
    return response_logs
