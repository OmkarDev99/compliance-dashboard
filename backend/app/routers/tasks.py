from fastapi import APIRouter, Depends, HTTPException, status
from datetime import date, datetime
import uuid
from pydantic import BaseModel
from typing import List, Optional, Literal
from app.core.dependencies import get_current_user, require_same_organization, get_permissions, PermissionChecker
from app.models.task import Task
from app.models.company import Company
from app.models.compliance_rule import ComplianceRule
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.team import Team
from app.models.task_comment import TaskComment
from app.schemas.task import TaskResponse, TaskDetailResponse, TaskUpdate, TaskAssignmentUpdate, CompanyMinResponse, RuleMinResponse, UserMinResponse, AuditLogMinResponse, TaskCommentCreate, TaskCommentResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])

async def _task_for_user(task_id: uuid.UUID, user: User) -> Task:
    return await require_same_organization(await Task.get(task_id), user)

def _work_role(user: User) -> str:
    return (user.designation or user.role or "").lower().replace(" ", "_")

async def _validate_assignment_authority(user: User, team: Team) -> None:
    role = _work_role(user)
    if role in {"executive", "intern", "staff"}:
        raise HTTPException(status_code=403, detail="Executives cannot assign tasks")
    if "can_assign_tasks" not in await get_permissions(user):
        raise HTTPException(status_code=403, detail="Missing required permission")
    if role == "team_lead" and team.id not in user.team_ids and user.id not in team.member_ids:
        raise HTTPException(status_code=403, detail="Team Leads can assign work only within their team")

@router.get("/assignment-options")
async def task_assignment_options(current_user: User = Depends(get_current_user)):
    """Tenant-scoped options used by the assignment drawer; no cross-firm users leak."""
    users = await User.find({"organization_id": current_user.organization_id, "is_active": True}).sort("full_name").to_list()
    teams = await Team.find({"organization_id": current_user.organization_id}).sort("name").to_list()
    return {
        "users": [UserMinResponse(id=user.id, email=user.email, full_name=user.full_name, role=user.role).model_dump() | {"designation": user.designation, "team_ids": user.team_ids} for user in users],
        "teams": [{"id": team.id, "name": team.name, "member_ids": team.member_ids} for team in teams],
    }

@router.put("/{task_id}/assignment")
async def assign_task(
    task_id: uuid.UUID,
    assignment: TaskAssignmentUpdate,
    current_user: User = Depends(get_current_user),
):
    task = await _task_for_user(task_id, current_user)
    team = await Team.get(assignment.assigned_team_id)
    if not team or team.organization_id != current_user.organization_id:
        raise HTTPException(status_code=400, detail="Assigned team must belong to this organization")
    await _validate_assignment_authority(current_user, team)
    ids = [assignment.assigned_user_id, assignment.reviewer_id, assignment.approver_id]
    users = await User.find({"_id": {"$in": ids}, "organization_id": current_user.organization_id, "is_active": True}).to_list()
    if len(users) != len(set(ids)):
        raise HTTPException(status_code=400, detail="Assigned users must be active members of this organization")
    executive = next(user for user in users if user.id == assignment.assigned_user_id)
    if executive.id not in team.member_ids and team.id not in executive.team_ids:
        raise HTTPException(status_code=400, detail="Assigned executive must belong to the selected team")
    previous = {field: str(getattr(task, field)) if getattr(task, field) else None for field in assignment.model_dump()}
    for field, value in assignment.model_dump().items():
        setattr(task, field, value)
    # Legacy task fields remain synchronized with the new lifecycle fields.
    task.assigned_team = assignment.assigned_team_id
    task.assigned_user = assignment.assigned_user_id
    task.assigned_to = assignment.assigned_user_id
    task.reviewer = assignment.reviewer_id
    task.approver = assignment.approver_id
    if task.status in {"upcoming", "pending"}:
        task.status = "assigned"
    task.updated_at = datetime.utcnow()
    await task.save()
    await AuditLog(user_id=current_user.id, organization_id=current_user.organization_id,
                   action="task_assignment_updated", entity_type="task", entity_id=task.id,
                   action_metadata={"old": previous, "new": assignment.model_dump(mode="json")}).insert()
    return {"id": str(task.id), "status": task.status}

async def _transition(task_id: uuid.UUID, user: User, target: str, permission: str | None, action: str):
    task = await _task_for_user(task_id, user)
    if permission and permission not in await get_permissions(user):
        raise HTTPException(status_code=403, detail="Missing required permission")
    old_status = task.status
    task.status = target
    task.updated_at = datetime.utcnow()
    await task.save()
    await AuditLog(user_id=user.id, organization_id=user.organization_id, action=action,
                   entity_type="task", entity_id=task.id,
                   action_metadata={"old_status": old_status, "new_status": target}).insert()
    return {"id": str(task.id), "status": task.status}

@router.post("/{task_id}/submit-review")
async def submit_for_review(task_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    return await _transition(task_id, current_user, "waiting_for_review", None, "task_submitted_for_review")

@router.post("/{task_id}/review")
async def review_task(task_id: uuid.UUID, approve: bool = True, current_user: User = Depends(get_current_user)):
    return await _transition(task_id, current_user, "approved" if approve else "changes_requested", "can_review_tasks", "task_reviewed")

@router.post("/{task_id}/approve")
async def approve_task(task_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    return await _transition(task_id, current_user, "approved", "can_approve_tasks", "task_approved")

@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[str] = None,
    current_stage: Optional[str] = None,
    company_id: Optional[uuid.UUID] = None,
    assigned_to: Optional[uuid.UUID] = None,
    due_start: Optional[date] = None,
    due_end: Optional[date] = None,
    category: Optional[str] = None,  # cs, ca
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    query = {"organization_id": current_user.organization_id}
    if status is not None:
        query["status"] = status
    if current_stage is not None:
        query["current_stage"] = current_stage
    if company_id is not None:
        query["company_id"] = company_id
    if assigned_to is not None:
        query["assigned_to"] = assigned_to
    if category is not None:
        query["category"] = category
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
                current_stage=t.current_stage,
                assigned_to=t.assigned_to,
                completed_by=t.completed_by,
                completed_at=t.completed_at,
                reference_doc=t.reference_doc,
                notes=t.notes,
                category=t.category,
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
    task = await _task_for_user(task_id, current_user)
        
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
        "organization_id": current_user.organization_id, "entity_type": "task", "entity_id": task_id
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
        
    # Fetch comments
    comments_list = await TaskComment.find({"task_id": task_id}).sort("created_at").to_list()
    response_comments = [
        TaskCommentResponse(
            id=c.id,
            task_id=c.task_id,
            user_id=c.user_id,
            user_name=c.user_name,
            content=c.content,
            created_at=c.created_at
        ) for c in comments_list
    ]
        
    task_detail = TaskDetailResponse(
        id=task.id,
        company_id=task.company_id,
        rule_id=task.rule_id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        status=task.status,
        current_stage=task.current_stage,
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
        audit_logs=response_logs,
        comments=response_comments
    )
    return task_detail

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user)
):
    task = await _task_for_user(task_id, current_user)

    permissions = await get_permissions(current_user)
    if any(key in task_in.model_fields_set for key in ("assigned_to", "assigned_team", "assigned_user")) and "can_assign_tasks" not in permissions:
        raise HTTPException(status_code=403, detail="Missing required permission")
    if "reviewer" in task_in.model_fields_set and "can_review_tasks" not in permissions:
        raise HTTPException(status_code=403, detail="Missing required permission")
    if "approver" in task_in.model_fields_set and "can_approve_tasks" not in permissions:
        raise HTTPException(status_code=403, detail="Missing required permission")
        
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
            user_id=current_user.id, organization_id=current_user.organization_id,
            action="task_reassigned",
            entity_type="task",
            entity_id=task.id,
            action_metadata={"old_assignee": old_name, "new_assignee": new_name}
        )
        await audit.insert()
    elif status_changed:
        audit = AuditLog(
            user_id=current_user.id, organization_id=current_user.organization_id,
            action="task_status_updated",
            entity_type="task",
            entity_id=task.id,
            action_metadata={"old_status": old_status, "new_status": new_status}
        )
        await audit.insert()
    else:
        audit = AuditLog(
            user_id=current_user.id, organization_id=current_user.organization_id,
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
        current_stage=task.current_stage,
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
    task = await _task_for_user(task_id, current_user)
        
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
            current_stage=task.current_stage,
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
        user_id=current_user.id, organization_id=current_user.organization_id,
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
        current_stage=task.current_stage,
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
    task = await _task_for_user(task_id, current_user)
        
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
            current_stage=task.current_stage,
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
        user_id=current_user.id, organization_id=current_user.organization_id,
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
        current_stage=task.current_stage,
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
    current_user: User = Depends(PermissionChecker("can_manage_settings"))
):
    task = await _task_for_user(task_id, current_user)
        
    await task.delete()
    
    audit = AuditLog(
        user_id=current_user.id, organization_id=current_user.organization_id,
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
        current_stage=task.current_stage,
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

class WorkflowTransitionRequest(BaseModel):
    action: Literal["submit", "approve", "request_changes", "reject"]
    comment: Optional[str] = None

@router.post("/{task_id}/transition")
async def transition_task_workflow(
    task_id: uuid.UUID,
    req: WorkflowTransitionRequest,
    current_user: User = Depends(get_current_user)
):
    task = await _task_for_user(task_id, current_user)
    work_role = _work_role(current_user)
    old_status = task.status
    old_stage = task.current_stage or "executive"
    
    if old_stage == "executive":
        if req.action != "submit":
            raise HTTPException(status_code=400, detail="Invalid action for Executive stage. Only 'submit' is allowed.")
        task.status = "waiting_for_review"
        task.current_stage = "team_lead"
        
    elif old_stage == "team_lead":
        permissions = await get_permissions(current_user)
        if "can_review_tasks" not in permissions and work_role not in {"team_lead", "manager", "partner", "admin"}:
            raise HTTPException(status_code=403, detail="Only Team Leads, Managers, or Partners can review at this stage.")
            
        if req.action == "approve":
            task.status = "waiting_for_review"
            task.current_stage = "manager"
        elif req.action == "request_changes":
            task.status = "changes_requested"
            task.current_stage = "executive"
        elif req.action == "reject":
            task.status = "rejected"
            task.current_stage = "executive"
        else:
            raise HTTPException(status_code=400, detail="Invalid action for Team Lead stage.")
            
    elif old_stage == "manager":
        permissions = await get_permissions(current_user)
        if "can_review_tasks" not in permissions and work_role not in {"manager", "partner", "admin"}:
            raise HTTPException(status_code=403, detail="Only Managers or Partners can review at this stage.")
            
        if req.action == "approve":
            task.status = "waiting_for_review"
            task.current_stage = "partner"
        elif req.action == "request_changes":
            task.status = "changes_requested"
            task.current_stage = "executive"
        elif req.action == "reject":
            task.status = "rejected"
            task.current_stage = "executive"
        else:
            raise HTTPException(status_code=400, detail="Invalid action for Manager stage.")
            
    elif old_stage == "partner":
        permissions = await get_permissions(current_user)
        if "can_approve_tasks" not in permissions and work_role not in {"partner", "admin"}:
            raise HTTPException(status_code=403, detail="Only Partners or Admins can approve at this stage.")
            
        if req.action == "approve":
            task.status = "completed"
            task.current_stage = "completed"
            task.completed_by = current_user.id
            task.completed_at = datetime.utcnow()
        elif req.action == "request_changes":
            task.status = "changes_requested"
            task.current_stage = "executive"
        elif req.action == "reject":
            task.status = "rejected"
            task.current_stage = "executive"
        else:
            raise HTTPException(status_code=400, detail="Invalid action for Partner stage.")
    else:
        raise HTTPException(status_code=400, detail=f"Cannot transition task in stage: {old_stage}")
        
    task.updated_at = datetime.utcnow()
    await task.save()
    
    comment_id = None
    if req.comment:
        comment = TaskComment(
            task_id=task.id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            user_name=current_user.full_name or current_user.email,
            content=req.comment
        )
        await comment.insert()
        comment_id = comment.id
        
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action=f"task_workflow_{req.action}",
        entity_type="task",
        entity_id=task.id,
        action_metadata={
            "old_status": old_status,
            "new_status": task.status,
            "old_stage": old_stage,
            "new_stage": task.current_stage,
            "comment": req.comment,
            "comment_id": str(comment_id) if comment_id else None
        }
    )
    await audit.insert()
    
    return {
        "id": str(task.id),
        "status": task.status,
        "current_stage": task.current_stage
    }

@router.get("/{task_id}/comments", response_model=List[TaskCommentResponse])
async def get_task_comments(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    await _task_for_user(task_id, current_user)
    comments = await TaskComment.find({"task_id": task_id}).sort("created_at").to_list()
    return comments

@router.post("/{task_id}/comments", response_model=TaskCommentResponse)
async def create_task_comment(
    task_id: uuid.UUID,
    comment_in: TaskCommentCreate,
    current_user: User = Depends(get_current_user)
):
    task = await _task_for_user(task_id, current_user)
    comment = TaskComment(
        task_id=task.id,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        user_name=current_user.full_name or current_user.email,
        content=comment_in.content
    )
    await comment.insert()
    
    # Log comment addition
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="task_comment_added",
        entity_type="task",
        entity_id=task.id,
        action_metadata={"comment_id": str(comment.id)}
    )
    await audit.insert()
    
    return comment
