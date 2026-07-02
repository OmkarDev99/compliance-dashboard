from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid
from typing import List
from app.core.db import get_db
from app.core.dependencies import RoleChecker, get_current_user
from app.core.security import get_password_hash
from app.models.user import User
from app.models.compliance_rule import ComplianceRule
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.schemas.compliance_rule import ComplianceRuleResponse, ComplianceRuleCreate, ComplianceRuleUpdate

# Use Depends(RoleChecker(...)) — this is the correct pattern for router-level role guards
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(RoleChecker(["admin"]))]
)

# Users Management
@router.get("/users", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: uuid.UUID, user_in: UserUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        user.hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        
    for field, value in update_data.items():
        setattr(user, field, value)
        
    await db.commit()
    await db.refresh(user)
    return user

# Compliance Rules Management
@router.get("/rules", response_model=List[ComplianceRuleResponse])
async def list_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ComplianceRule).order_by(ComplianceRule.name.asc()))
    return result.scalars().all()

@router.post("/rules", response_model=ComplianceRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(rule_in: ComplianceRuleCreate, db: AsyncSession = Depends(get_db)):
    rule = ComplianceRule(**rule_in.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule

@router.put("/rules/{rule_id}", response_model=ComplianceRuleResponse)
async def update_rule(rule_id: uuid.UUID, rule_in: ComplianceRuleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ComplianceRule).filter(ComplianceRule.id == rule_id))
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
        
    await db.commit()
    await db.refresh(rule)
    return rule
