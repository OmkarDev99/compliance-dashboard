from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
import re, uuid

from app.core.dependencies import get_current_user, get_permissions
from app.models.organization import Organization
from app.models.team import Team
from app.models.role import Role
from app.models.user import User
from app.models.company import Company
from app.models.task import Task
from app.models.audit_log import AuditLog
from app.models.role import DEFAULT_PERMISSIONS

router = APIRouter(prefix="/organizations", tags=["organizations"])

class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2)
    slug: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    subscription_plan: str = "starter"

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2)
    email: Optional[str] = None
    phone: Optional[str] = None
    logo: Optional[str] = None

class TeamInput(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    member_ids: list[uuid.UUID] = Field(default_factory=list)

class RoleInput(BaseModel):
    name: str
    permissions: list[str] = Field(default_factory=list)

def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

async def _ensure_org_admin(user: User):
    permissions = await get_permissions(user)
    if "can_manage_settings" not in permissions:
        raise HTTPException(status_code=403, detail="Missing required permission")

async def _validated_team_members(data: TeamInput, organization_id: uuid.UUID):
    ids = list(dict.fromkeys(data.member_ids))
    if data.manager_id and data.manager_id not in ids:
        ids.append(data.manager_id)
    members = await User.find({
        "_id": {"$in": ids},
        "organization_id": organization_id,
        "is_active": True,
    }).to_list() if ids else []
    if len(members) != len(ids):
        raise HTTPException(status_code=400, detail="All team members must be active members of this workspace")
    return ids, members

@router.get("/current")
async def current_organization(user: User = Depends(get_current_user)):
    if not user.organization_id:
        raise HTTPException(status_code=404, detail="Organization not found")
    org = await Organization.get(user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.patch("/current")
async def update_current_organization(data: OrganizationUpdate, user: User = Depends(get_current_user)):
    await _ensure_org_admin(user)
    org = await Organization.get(user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(org, field, value)
    await org.save()
    await AuditLog(
        user_id=user.id,
        organization_id=user.organization_id,
        action="organization_updated",
        entity_type="organization",
        entity_id=org.id,
        action_metadata={"fields_updated": list(changes.keys())},
    ).insert()
    return org

@router.get("/summary")
async def organization_summary(user: User = Depends(get_current_user)):
    org_id = user.organization_id
    return {
        "members": await User.find({"organization_id": org_id, "is_active": True}).count(),
        "teams": await Team.find({"organization_id": org_id}).count(),
        "companies": await Company.find({"organization_id": org_id, "is_active": True}).count(),
        "open_tasks": await Task.find({"organization_id": org_id, "status": {"$ne": "completed"}}).count(),
    }

@router.get("")
async def list_organizations(user: User = Depends(get_current_user)):
    if user.role != "platform_admin":
        return [await Organization.get(user.organization_id)] if user.organization_id else []
    return await Organization.find().sort("name").to_list()

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_organization(data: OrganizationCreate, user: User = Depends(get_current_user)):
    if user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="Platform administrator access required")
    slug = _slug(data.slug or data.name)
    if await Organization.find_one({"slug": slug}):
        raise HTTPException(status_code=400, detail="Organization slug already exists")
    org = Organization(**data.model_dump(exclude={"slug"}), slug=slug)
    await org.insert()
    return org

@router.get("/teams")
async def list_teams(user: User = Depends(get_current_user)):
    return await Team.find({"organization_id": user.organization_id}).sort("name").to_list()

@router.post("/teams", status_code=status.HTTP_201_CREATED)
async def create_team(data: TeamInput, user: User = Depends(get_current_user)):
    await _ensure_org_admin(user)
    if await Team.find_one({"organization_id": user.organization_id, "name": data.name}):
        raise HTTPException(status_code=400, detail="Team name already exists")
    ids, members = await _validated_team_members(data, user.organization_id)
    team = Team(organization_id=user.organization_id, **data.model_dump(exclude={"member_ids"}), member_ids=ids)
    await team.insert()
    for member in members:
        if team.id not in member.team_ids:
            member.team_ids.append(team.id)
            await member.save()
    await AuditLog(
        user_id=user.id,
        organization_id=user.organization_id,
        action="team_created",
        entity_type="team",
        entity_id=team.id,
        action_metadata={"team_name": team.name, "member_count": len(team.member_ids)},
    ).insert()
    return team

@router.put("/teams/{team_id}")
async def update_team(team_id: uuid.UUID, data: TeamInput, user: User = Depends(get_current_user)):
    await _ensure_org_admin(user)
    team = await Team.get(team_id)
    if not team or team.organization_id != user.organization_id:
        raise HTTPException(status_code=404, detail="Team not found")
    duplicate = await Team.find_one({
        "organization_id": user.organization_id,
        "name": data.name,
        "_id": {"$ne": team_id},
    })
    if duplicate:
        raise HTTPException(status_code=400, detail="Team name already exists")

    ids, members = await _validated_team_members(data, user.organization_id)
    previous_member_ids = set(team.member_ids)
    next_member_ids = set(ids)
    removed_ids = list(previous_member_ids - next_member_ids)
    removed_members = await User.find({
        "_id": {"$in": removed_ids},
        "organization_id": user.organization_id,
    }).to_list() if removed_ids else []
    for member in removed_members:
        member.team_ids = [item for item in member.team_ids if item != team.id]
        await member.save()
    for member in members:
        if team.id not in member.team_ids:
            member.team_ids.append(team.id)
            await member.save()

    old_name = team.name
    team.name = data.name
    team.description = data.description
    team.manager_id = data.manager_id
    team.member_ids = ids
    await team.save()
    await AuditLog(
        user_id=user.id,
        organization_id=user.organization_id,
        action="team_updated",
        entity_type="team",
        entity_id=team.id,
        action_metadata={
            "old_name": old_name,
            "new_name": team.name,
            "member_count": len(team.member_ids),
        },
    ).insert()
    return team

@router.get("/roles")
async def list_roles(user: User = Depends(get_current_user)):
    return await Role.find({"organization_id": user.organization_id}).sort("name").to_list()

@router.post("/roles", status_code=status.HTTP_201_CREATED)
async def create_role(data: RoleInput, user: User = Depends(get_current_user)):
    await _ensure_org_admin(user)
    if await Role.find_one({"organization_id": user.organization_id, "name": data.name}):
        raise HTTPException(status_code=400, detail="Role name already exists")
    allowed_permissions = {permission for values in DEFAULT_PERMISSIONS.values() for permission in values}
    invalid = sorted(set(data.permissions) - allowed_permissions)
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown permissions: {', '.join(invalid)}")
    role = Role(organization_id=user.organization_id, **data.model_dump())
    await role.insert()
    return role

@router.get("/hierarchy")
async def hierarchy(user: User = Depends(get_current_user)):
    users = await User.find({"organization_id": user.organization_id, "is_active": True}).sort("full_name").to_list()
    return [{
        "id": item.id,
        "name": item.full_name or item.email,
        "email": item.email,
        "role": item.role,
        "designation": item.designation,
        "reports_to": item.reports_to,
        "team_ids": item.team_ids,
    } for item in users]
