from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import date, datetime
import uuid
from typing import List, Optional
from app.core.db import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.task import Task
from app.models.company import Company
from app.models.compliance_rule import ComplianceRule
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.task import TaskResponse, TaskDetailResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[str] = None,
    company_id: Optional[uuid.UUID] = None,
    assigned_to: Optional[uuid.UUID] = None,
    due_start: Optional[date] = None,
    due_end: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Eager-load company + assigned_user so frontend can access task.company.name
    query = select(Task).options(
        selectinload(Task.company),
        selectinload(Task.assigned_user)
    )
    if status is not None:
        query = query.filter(Task.status == status)
    if company_id is not None:
        query = query.filter(Task.company_id == company_id)
    if assigned_to is not None:
        query = query.filter(Task.assigned_to == assigned_to)
    if due_start is not None:
        query = query.filter(Task.due_date >= due_start)
    if due_end is not None:
        query = query.filter(Task.due_date <= due_end)
        
    query = query.order_by(Task.due_date.asc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{task_id}", response_model=TaskDetailResponse)
async def get_task_detail(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(Task)
        .filter(Task.id == task_id)
        .options(
            selectinload(Task.company),
            selectinload(Task.rule),
            selectinload(Task.assigned_user),
            selectinload(Task.completed_user)
        )
    )
    result = await db.execute(query)
    task = result.scalars().first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    audit_query = (
        select(AuditLog)
        .filter(AuditLog.entity_type == "task", AuditLog.entity_id == task_id)
        .options(selectinload(AuditLog.user))
        .order_by(AuditLog.created_at.desc())
        .limit(5)
    )
    audit_result = await db.execute(audit_query)
    audit_logs = audit_result.scalars().all()
    
    task_detail = TaskDetailResponse.model_validate(task)
    task_detail.audit_logs = audit_logs
    
    return task_detail

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(Task)
        .filter(Task.id == task_id)
        .options(selectinload(Task.assigned_user))
    )
    result = await db.execute(query)
    task = result.scalars().first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_in.model_dump(exclude_unset=True)
    
    assignee_changed = False
    old_assignee_id = task.assigned_to
    new_assignee_id = update_data.get("assigned_to", old_assignee_id)
    
    if "assigned_to" in update_data and old_assignee_id != new_assignee_id:
        assignee_changed = True
        
    status_changed = False
    old_status = task.status
    new_status = update_data.get("status", old_status)
    if "status" in update_data and old_status != new_status:
        status_changed = True
        
    for field, value in update_data.items():
        setattr(task, field, value)
        
    await db.flush()
    
    if assignee_changed:
        old_name = "Unassigned"
        new_name = "Unassigned"
        if old_assignee_id:
            old_usr = (await db.execute(select(User).filter(User.id == old_assignee_id))).scalars().first()
            if old_usr: old_name = old_usr.full_name or old_usr.email
        if new_assignee_id:
            new_usr = (await db.execute(select(User).filter(User.id == new_assignee_id))).scalars().first()
            if new_usr: new_name = new_usr.full_name or new_usr.email
            
        audit = AuditLog(
            user_id=current_user.id,
            action="task_reassigned",
            entity_type="task",
            entity_id=task.id,
            action_metadata={"old_assignee": old_name, "new_assignee": new_name}
        )
        db.add(audit)
    elif status_changed:
        audit = AuditLog(
            user_id=current_user.id,
            action="task_status_updated",
            entity_type="task",
            entity_id=task.id,
            action_metadata={"old_status": old_status, "new_status": new_status}
        )
        db.add(audit)
    else:
        audit = AuditLog(
            user_id=current_user.id,
            action="task_updated",
            entity_type="task",
            entity_id=task.id,
            action_metadata={"fields_updated": list(update_data.keys())}
        )
        db.add(audit)
        
    await db.commit()
    await db.refresh(task)
    return task

@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Task).filter(Task.id == task_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status == "completed":
        return task
        
    old_status = task.status
    task.status = "completed"
    task.completed_by = current_user.id
    task.completed_at = datetime.utcnow()
    
    audit = AuditLog(
        user_id=current_user.id,
        action="task_completed",
        entity_type="task",
        entity_id=task.id,
        action_metadata={"old_status": old_status, "completed_by_name": current_user.full_name or current_user.email}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(task)
    return task

@router.post("/{task_id}/reopen", response_model=TaskResponse)
async def reopen_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Task).filter(Task.id == task_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status != "completed":
        return task
        
    task.status = "upcoming"
    task.completed_by = None
    task.completed_at = None
    
    audit = AuditLog(
        user_id=current_user.id,
        action="task_reopened",
        entity_type="task",
        entity_id=task.id,
        action_metadata={"reopened_by_name": current_user.full_name or current_user.email}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/{task_id}", response_model=TaskResponse)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = require_role("admin")
):
    result = await db.execute(select(Task).filter(Task.id == task_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    await db.delete(task)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="task_deleted",
        entity_type="task",
        entity_id=task_id,
        action_metadata={"task_title": task.title}
    )
    db.add(audit)
    await db.commit()
    return task
