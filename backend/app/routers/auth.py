from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.schemas.user import LoginRequest, TokenResponse, UserResponse, UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    email = login_data.email.lower()
    user = await User.find_one(User.email == email)
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
        
    access_token = create_access_token(subject=user.id, role=user.role, organization_id=user.organization_id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    email = user_in.email.lower()
    existing = await User.find_one(User.email == email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    # Public registration provisions an isolated tenant for the first administrator.
    slug_base = email.split("@")[0].replace("_", "-")
    slug = slug_base
    counter = 2
    while await Organization.find_one({"slug": slug}):
        slug = f"{slug_base}-{counter}"
        counter += 1
    organization = Organization(name=(user_in.full_name or slug_base) + " Workspace", slug=slug)
    await organization.insert()
    user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role="admin",
        organization_id=organization.id,
        is_active=True
    )
    await user.insert()
    
    access_token = create_access_token(subject=user.id, role=user.role, organization_id=user.organization_id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
