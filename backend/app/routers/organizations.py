from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
import re, uuid

from app.core.dependencies import get_current_user, get_permissions
from app.models.organization import Organization
from app.models.team import Team
from app.models.role import Role
from app.models.user import User

router = APIRouter(prefix="/organizations", tags=["organizations"])

class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2)
    slug: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    subscription_plan: str = "starter"

class TeamInput(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    member_ids: list[uuid.UUID] = []

class RoleInput(BaseModel):
    name: str
    permissions: list[str] = []

def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

async def _ensure_org_admin(user: User):
    permissions = await get_permissions(user)
    if "can_manage_settings" not in permissions:
        raise HTTPException(status_code=403, detail="Missing required permission")

@router.get("/current")
async def current_organization(user: User = Depends(get_current_user)):
    if not user.organization_id:
        raise HTTPException(status_code=404, detail="Organization not found")
    org = await Organization.get(user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

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
    ids = [item for item in data.member_ids]
    if data.manager_id and data.manager_id not in ids:
        ids.append(data.manager_id)
    members = await User.find({"_id": {"$in": ids}, "organization_id": user.organization_id}).to_list() if ids else []
    if len(members) != len(set(ids)):
        raise HTTPException(status_code=400, detail="All team members must belong to this organization")
    team = Team(organization_id=user.organization_id, **data.model_dump(exclude={"member_ids"}), member_ids=ids)
    await team.insert()
    for member in members:
        if team.id not in member.team_ids:
            member.team_ids.append(team.id)
            await member.save()
    return team

@router.get("/roles")
async def list_roles(user: User = Depends(get_current_user)):
    return await Role.find({"organization_id": user.organization_id}).sort("name").to_list()

@router.post("/roles", status_code=status.HTTP_201_CREATED)
async def create_role(data: RoleInput, user: User = Depends(get_current_user)):
    await _ensure_org_admin(user)
    role = Role(organization_id=user.organization_id, **data.model_dump())
    await role.insert()
    return role

@router.get("/hierarchy")
async def hierarchy(user: User = Depends(get_current_user)):
    users = await User.find({"organization_id": user.organization_id, "is_active": True}).sort("full_name").to_list()
    return [{"id": item.id, "name": item.full_name or item.email, "designation": item.designation, "reports_to": item.reports_to, "team_ids": item.team_ids} for item in users]
