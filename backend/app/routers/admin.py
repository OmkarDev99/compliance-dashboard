from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from typing import List, Optional
from app.core.dependencies import RoleChecker, get_current_user, get_permissions, require_same_organization
from app.core.security import get_password_hash
from app.models.user import User
from app.models.compliance_rule import ComplianceRule
from app.models.audit_log import AuditLog
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.schemas.compliance_rule import ComplianceRuleResponse, ComplianceRuleCreate, ComplianceRuleUpdate
from app.schemas.task import AuditLogMinResponse, UserMinResponse

# Use Depends(RoleChecker(...))
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(RoleChecker(["admin"]))]
)

# Users Management
@router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: User = Depends(get_current_user)):
    users = await User.find({"organization_id": current_user.organization_id}).sort("-created_at").to_list()
    return users

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate, current_user: User = Depends(get_current_user)):
    existing = await User.find_one({"email": user_in.email, "organization_id": current_user.organization_id})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active, organization_id=current_user.organization_id,
        team_ids=user_in.team_ids, role_id=user_in.role_id, reports_to=user_in.reports_to,
        designation=user_in.designation, permissions=user_in.permissions,
    )
    await user.insert()
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: uuid.UUID, user_in: UserUpdate, current_user: User = Depends(get_current_user)):
    user = await User.get(user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        user.hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        
    for field, value in update_data.items():
        setattr(user, field, value)
        
    await user.save()
    return user

# Compliance Rules Management
@router.get("/rules", response_model=List[ComplianceRuleResponse])
async def list_rules(current_user: User = Depends(get_current_user)):
    rules = await ComplianceRule.find({"$or": [{"organization_id": current_user.organization_id}, {"organization_id": None}]}).sort("name").to_list()
    return rules

@router.post("/rules", response_model=ComplianceRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(rule_in: ComplianceRuleCreate, current_user: User = Depends(get_current_user)):
    rule = ComplianceRule(**rule_in.model_dump(), organization_id=current_user.organization_id)
    await rule.insert()
    return rule

@router.put("/rules/{rule_id}", response_model=ComplianceRuleResponse)
async def update_rule(rule_id: uuid.UUID, rule_in: ComplianceRuleUpdate, current_user: User = Depends(get_current_user)):
    rule = await ComplianceRule.get(rule_id)
    if not rule or (rule.organization_id and rule.organization_id != current_user.organization_id):
        raise HTTPException(status_code=404, detail="Rule not found")
        
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
        
    await rule.save()
    return rule


# System-wide Audit Logs
@router.get("/audit-logs", response_model=List[AuditLogMinResponse])
async def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve system-wide audit logs with optional filters.
    - **action**: Filter by action type (e.g., task_completed, company_created).
    - **entity_type**: Filter by entity type (e.g., task, company).
    - **user_id**: Filter by the user who performed the action.
    - **limit** / **offset**: Pagination controls.
    """
    query = {"organization_id": current_user.organization_id}
    if action is not None:
        query["action"] = action
    if entity_type is not None:
        query["entity_type"] = entity_type
    if user_id is not None:
        query["user_id"] = user_id

    logs = await AuditLog.find(query).sort("-created_at").skip(offset).limit(limit).to_list()

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
