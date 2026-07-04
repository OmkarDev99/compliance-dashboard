from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from typing import List
from app.core.dependencies import RoleChecker
from app.core.security import get_password_hash
from app.models.user import User
from app.models.compliance_rule import ComplianceRule
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.schemas.compliance_rule import ComplianceRuleResponse, ComplianceRuleCreate, ComplianceRuleUpdate

# Use Depends(RoleChecker(...))
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(RoleChecker(["admin"]))]
)

# Users Management
@router.get("/users", response_model=List[UserResponse])
async def list_users():
    users = await User.find().sort("-created_at").to_list()
    return users

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate):
    existing = await User.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active
    )
    await user.insert()
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: uuid.UUID, user_in: UserUpdate):
    user = await User.get(user_id)
    if not user:
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
async def list_rules():
    rules = await ComplianceRule.find().sort("name").to_list()
    return rules

@router.post("/rules", response_model=ComplianceRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(rule_in: ComplianceRuleCreate):
    rule = ComplianceRule(**rule_in.model_dump())
    await rule.insert()
    return rule

@router.put("/rules/{rule_id}", response_model=ComplianceRuleResponse)
async def update_rule(rule_id: uuid.UUID, rule_in: ComplianceRuleUpdate):
    rule = await ComplianceRule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
        
    await rule.save()
    return rule
