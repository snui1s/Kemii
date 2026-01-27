from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import Session, select
from core.database import get_session
from models import User
from schemas import LoginRequest, RegisterRequest, AuthResponse, UserPublic
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
            raise HTTPException(status_code=401, detail="Token ไม่ถูกต้อง")
        return str(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token ไม่ถูกต้องหรือหมดอายุ")

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, session: Session = Depends(get_session)):
    existing_user = session.exec(select(User).where(User.email == req.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="อีเมลนี้ถูกลงทะเบียนแล้ว")
    
    skills_data = [{"name": dept, "level": 1} for dept in req.departments]
    
    new_user = User(
        name=req.name,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        skills=json.dumps(skills_data),
        character_class="Novice",
        level=1,
        ocean_openness=0,
        ocean_conscientiousness=0,
        ocean_extraversion=0,
        ocean_agreeableness=0,
        ocean_neuroticism=0
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    access_token = create_access_token(user_id=new_user.id)
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == req.email)).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        
    access_token = create_access_token(user_id=user.id)
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/users/me", response_model=UserPublic)
def read_users_me(user_id: str = Depends(get_current_user_id), session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้งาน")
    return user
