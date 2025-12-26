from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import Session, select
from core.database import get_session
from models import User
from schemas import LoginRequest, RegisterRequest
from core.auth import create_access_token, verify_password, get_password_hash, SECRET_KEY, ALGORITHM
import json

router = APIRouter(tags=["Authentication"])
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/register")
def register(req: RegisterRequest, session: Session = Depends(get_session)):
    # 1. Check if email exists
    existing_user = session.exec(select(User).where(User.email == req.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Prepare Skills from Departments
    # Structure: [{"name": "Department Name", "level": 1}]
    skills_data = [{"name": dept, "level": 1} for dept in req.departments]
    
    # 3. Create User
    new_user = User(
        name=req.name,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        skills=json.dumps(skills_data),
        character_class="Novice", # Default
        level=1,
        # Default stats
        ocean_openness=0,
        ocean_conscientiousness=0,
        ocean_extraversion=0,
        ocean_agreeableness=0,
        ocean_neuroticism=0
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Auto-login? Or just return success. Let's return token to be nice.
    access_token = create_access_token(user_id=new_user.id)
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/login")
def login(req: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == req.email)).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token = create_access_token(user_id=user.id)
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/users/me")
def read_users_me(user_id: int = Depends(get_current_user_id), session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
