from fastapi import APIRouter, Depends, HTTPException, status
from datetime import date, datetime
import uuid
from typing import List, Optional
from app.core.dependencies import get_current_user, require_role
from app.models.task import Task
from app.models.company import Company
from app.models.compliance_rule import ComplianceRule
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.task import TaskResponse, TaskDetailResponse, TaskUpdate, CompanyMinResponse, RuleMinResponse, UserMinResponse, AuditLogMinResponse

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
    current_user: User = Depends(get_current_user)
):
    query = {}
    if status is not None:
        query["status"] = status
    if company_id is not None:
        query["company_id"] = company_id
    if assigned_to is not None:
        query["assigned_to"] = assigned_to
    if due_start is not None:
        query["due_date"] = query.get("due_date", {})
        query["due_date"]["$gte"] = due_start
    if due_end is not None:
        query["due_date"] = query.get("due_date", {})
        query["due_date"]["$lte"] = due_end
        
    if "due_date" in query and not query["due_date"]:
        del query["due_date"]

    tasks = await Task.find(query).sort("due_date").skip(offset).limit(limit).to_list()
    
    response_tasks = []
    company_cache = {}
    user_cache = {}
    
    for t in tasks:
        company_min = None
        if t.company_id not in company_cache:
            c = await Company.get(t.company_id)
            if c:
                company_cache[t.company_id] = CompanyMinResponse(
                    id=c.id, name=c.name, cin=c.cin, company_type=c.company_type
                )
            else:
                company_cache[t.company_id] = None
        company_min = company_cache[t.company_id]
        
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

@router.get("/{task_id}", response_model=TaskDetailResponse)
async def get_task_detail(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    company_doc = await Company.get(task.company_id)
    company_min = CompanyMinResponse(
        id=company_doc.id, name=company_doc.name, cin=company_doc.cin, company_type=company_doc.company_type
    ) if company_doc else None
    
    rule_doc = await ComplianceRule.get(task.rule_id) if task.rule_id else None
    rule_min = RuleMinResponse(
        id=rule_doc.id, name=rule_doc.name, form_number=rule_doc.form_number
    ) if rule_doc else None
    
    assignee_doc = await User.get(task.assigned_to) if task.assigned_to else None
    assignee_min = UserMinResponse(
        id=assignee_doc.id, email=assignee_doc.email, full_name=assignee_doc.full_name, role=assignee_doc.role
    ) if assignee_doc else None
    
    completed_doc = await User.get(task.completed_by) if task.completed_by else None
    completed_min = UserMinResponse(
        id=completed_doc.id, email=completed_doc.email, full_name=completed_doc.full_name, role=completed_doc.role
    ) if completed_doc else None
    
    logs = await AuditLog.find({
        "entity_type": "task", "entity_id": task_id
    }).sort("-created_at").limit(5).to_list()
    
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
        
    task_detail = TaskDetailResponse(
        id=task.id,
        company_id=task.company_id,
        rule_id=task.rule_id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        status=task.status,
        assigned_to=task.assigned_to,
        completed_by=task.completed_by,
        completed_at=task.completed_at,
        reference_doc=task.reference_doc,
        notes=task.notes,
        created_at=task.created_at,
        updated_at=task.updated_at,
        company=company_min,
        rule=rule_min,
        assigned_user=assignee_min,
        completed_user=completed_min,
        audit_logs=response_logs
    )
    return task_detail

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user)
):
    task = await Task.get(task_id)
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

        # Keep completion metadata consistent for direct status changes.
        if new_status == "completed":
            task.completed_by = current_user.id
            task.completed_at = datetime.utcnow()
        elif old_status == "completed":
            task.completed_by = None
            task.completed_at = None
        task.status_manually_set = True
        
    for field, value in update_data.items():
        setattr(task, field, value)
        
    task.updated_at = datetime.utcnow()
    await task.save()
    
    if assignee_changed:
        old_name = "Unassigned"
        new_name = "Unassigned"
        if old_assignee_id:
            old_usr = await User.get(old_assignee_id)
            if old_usr: old_name = old_usr.full_name or old_usr.email
        if new_assignee_id:
            new_usr = await User.get(new_assignee_id)
            if new_usr: new_name = new_usr.full_name or new_usr.email
            
        audit = AuditLog(
            user_id=current_user.id,
            action="task_reassigned",
            entity_type="task",
            entity_id=task.id,
            action_metadata={"old_assignee": old_name, "new_assignee": new_name}
        )
        await audit.insert()
    elif status_changed:
        audit = AuditLog(
            user_id=current_user.id,
            action="task_status_updated",
            entity_type="task",
            entity_id=task.id,
            action_metadata={"old_status": old_status, "new_status": new_status}
        )
        await audit.insert()
    else:
        audit = AuditLog(
            user_id=current_user.id,
            action="task_updated",
            entity_type="task",
            entity_id=task.id,
            action_metadata={"fields_updated": list(update_data.keys())}
        )
        await audit.insert()
        
    company_doc = await Company.get(task.company_id)
    company_min = CompanyMinResponse(
        id=company_doc.id, name=company_doc.name, cin=company_doc.cin, company_type=company_doc.company_type
    ) if company_doc else None
    
    assignee_doc = await User.get(task.assigned_to) if task.assigned_to else None
    assignee_min = UserMinResponse(
        id=assignee_doc.id, email=assignee_doc.email, full_name=assignee_doc.full_name, role=assignee_doc.role
    ) if assignee_doc else None
    
    return TaskResponse(
        id=task.id,
        company_id=task.company_id,
        rule_id=task.rule_id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        status=task.status,
        assigned_to=task.assigned_to,
        completed_by=task.completed_by,
        completed_at=task.completed_at,
        reference_doc=task.reference_doc,
        notes=task.notes,
        created_at=task.created_at,
        updated_at=task.updated_at,
        company=company_min,
        assigned_user=assignee_min
    )

@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status == "completed":
        company_doc = await Company.get(task.company_id)
        company_min = CompanyMinResponse(
            id=company_doc.id, name=company_doc.name, cin=company_doc.cin, company_type=company_doc.company_type
        ) if company_doc else None
        assignee_doc = await User.get(task.assigned_to) if task.assigned_to else None
        assignee_min = UserMinResponse(
            id=assignee_doc.id, email=assignee_doc.email, full_name=assignee_doc.full_name, role=assignee_doc.role
        ) if assignee_doc else None
        return TaskResponse(
            id=task.id,
            company_id=task.company_id,
            rule_id=task.rule_id,
            title=task.title,
            description=task.description,
            due_date=task.due_date,
            status=task.status,
            assigned_to=task.assigned_to,
            completed_by=task.completed_by,
            completed_at=task.completed_at,
            reference_doc=task.reference_doc,
            notes=task.notes,
            created_at=task.created_at,
            updated_at=task.updated_at,
            company=company_min,
            assigned_user=assignee_min
        )
        
    old_status = task.status
    task.status = "completed"
    task.status_manually_set = True
    task.completed_by = current_user.id
    task.completed_at = datetime.utcnow()
    task.updated_at = datetime.utcnow()
    await task.save()
    
    audit = AuditLog(
        user_id=current_user.id,
        action="task_completed",
        entity_type="task",
        entity_id=task.id,
        action_metadata={"old_status": old_status, "completed_by_name": current_user.full_name or current_user.email}
    )
    await audit.insert()
    
    company_doc = await Company.get(task.company_id)
    company_min = CompanyMinResponse(
        id=company_doc.id, name=company_doc.name, cin=company_doc.cin, company_type=company_doc.company_type
    ) if company_doc else None
    
    assignee_doc = await User.get(task.assigned_to) if task.assigned_to else None
    assignee_min = UserMinResponse(
        id=assignee_doc.id, email=assignee_doc.email, full_name=assignee_doc.full_name, role=assignee_doc.role
    ) if assignee_doc else None
    
    return TaskResponse(
        id=task.id,
        company_id=task.company_id,
        rule_id=task.rule_id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        status=task.status,
        assigned_to=task.assigned_to,
        completed_by=task.completed_by,
        completed_at=task.completed_at,
        reference_doc=task.reference_doc,
        notes=task.notes,
        created_at=task.created_at,
        updated_at=task.updated_at,
        company=company_min,
        assigned_user=assignee_min
    )

@router.post("/{task_id}/reopen", response_model=TaskResponse)
async def reopen_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status != "completed":
        company_doc = await Company.get(task.company_id)
        company_min = CompanyMinResponse(
            id=company_doc.id, name=company_doc.name, cin=company_doc.cin, company_type=company_doc.company_type
        ) if company_doc else None
        assignee_doc = await User.get(task.assigned_to) if task.assigned_to else None
        assignee_min = UserMinResponse(
            id=assignee_doc.id, email=assignee_doc.email, full_name=assignee_doc.full_name, role=assignee_doc.role
        ) if assignee_doc else None
        return TaskResponse(
            id=task.id,
            company_id=task.company_id,
            rule_id=task.rule_id,
            title=task.title,
            description=task.description,
            due_date=task.due_date,
            status=task.status,
            assigned_to=task.assigned_to,
            completed_by=task.completed_by,
            completed_at=task.completed_at,
            reference_doc=task.reference_doc,
            notes=task.notes,
            created_at=task.created_at,
            updated_at=task.updated_at,
            company=company_min,
            assigned_user=assignee_min
        )
        
    task.status = "upcoming"
    task.status_manually_set = True
    task.completed_by = None
    task.completed_at = None
    task.updated_at = datetime.utcnow()
    await task.save()
    
    audit = AuditLog(
        user_id=current_user.id,
        action="task_reopened",
        entity_type="task",
        entity_id=task.id,
        action_metadata={"reopened_by_name": current_user.full_name or current_user.email}
    )
    await audit.insert()
    
    company_doc = await Company.get(task.company_id)
    company_min = CompanyMinResponse(
        id=company_doc.id, name=company_doc.name, cin=company_doc.cin, company_type=company_doc.company_type
    ) if company_doc else None
    
    assignee_doc = await User.get(task.assigned_to) if task.assigned_to else None
    assignee_min = UserMinResponse(
        id=assignee_doc.id, email=assignee_doc.email, full_name=assignee_doc.full_name, role=assignee_doc.role
    ) if assignee_doc else None
    
    return TaskResponse(
        id=task.id,
        company_id=task.company_id,
        rule_id=task.rule_id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        status=task.status,
        assigned_to=task.assigned_to,
        completed_by=task.completed_by,
        completed_at=task.completed_at,
        reference_doc=task.reference_doc,
        notes=task.notes,
        created_at=task.created_at,
        updated_at=task.updated_at,
        company=company_min,
        assigned_user=assignee_min
    )

@router.delete("/{task_id}", response_model=TaskResponse)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = require_role("admin")
):
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    await task.delete()
    
    audit = AuditLog(
        user_id=current_user.id,
        action="task_deleted",
        entity_type="task",
        entity_id=task_id,
        action_metadata={"task_title": task.title}
    )
    await audit.insert()
    
    company_doc = await Company.get(task.company_id)
    company_min = CompanyMinResponse(
        id=company_doc.id, name=company_doc.name, cin=company_doc.cin, company_type=company_doc.company_type
    ) if company_doc else None
    
    assignee_doc = await User.get(task.assigned_to) if task.assigned_to else None
    assignee_min = UserMinResponse(
        id=assignee_doc.id, email=assignee_doc.email, full_name=assignee_doc.full_name, role=assignee_doc.role
    ) if assignee_doc else None
    
    return TaskResponse(
        id=task.id,
        company_id=task.company_id,
        rule_id=task.rule_id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        status=task.status,
        assigned_to=task.assigned_to,
        completed_by=task.completed_by,
        completed_at=task.completed_at,
        reference_doc=task.reference_doc,
        notes=task.notes,
        created_at=task.created_at,
        updated_at=task.updated_at,
        company=company_min,
        assigned_user=assignee_min
    )
