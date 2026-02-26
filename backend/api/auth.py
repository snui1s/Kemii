from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import Session, select
from core.database import get_session
from models import User
from schemas import LoginRequest, RegisterRequest, AuthResponse, UserPublic
from core.auth import (
    create_access_token,
    verify_password,
    get_password_hash,
    SECRET_KEY,
    ALGORITHM,
)
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
        ocean_neuroticism=0,
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    access_token = create_access_token(user_id=new_user.id)

    # Convert User model to UserPublic dict
    user_dict = new_user.model_dump()
    user_dict["skills"] = skills_data  # Use the list we created
    # Ensure OCEAN scores have defaults if None (though we set them to 0 above)
    for field in [
        "ocean_openness",
        "ocean_conscientiousness",
        "ocean_extraversion",
        "ocean_agreeableness",
        "ocean_neuroticism",
    ]:
        if user_dict.get(field) is None:
            user_dict[field] = 0

    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == req.email)).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

    access_token = create_access_token(user_id=user.id)

    # Parse skills
    skills_parsed = (
        json.loads(user.skills)
        if user.skills and isinstance(user.skills, str)
        else (user.skills if user.skills else [])
    )

    # Convert User model to dict and update skills
    user_dict = user.model_dump()
    user_dict["skills"] = skills_parsed

    # Ensure OCEAN scores have defaults
    for field in [
        "ocean_openness",
        "ocean_conscientiousness",
        "ocean_extraversion",
        "ocean_agreeableness",
        "ocean_neuroticism",
    ]:
        if user_dict.get(field) is None:
            user_dict[field] = 0

    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}


@router.get("/users/me", response_model=UserPublic)
def read_users_me(
    user_id: str = Depends(get_current_user_id), session: Session = Depends(get_session)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้งาน")

    # Parse skills
    skills_parsed = (
        json.loads(user.skills)
        if user.skills and isinstance(user.skills, str)
        else (user.skills if user.skills else [])
    )

    # Convert parameters to compatible dict
    user_data = user.model_dump()
    user_data["skills"] = skills_parsed

    # Ensure OCEAN scores have defaults
    for field in [
        "ocean_openness",
        "ocean_conscientiousness",
        "ocean_extraversion",
        "ocean_agreeableness",
        "ocean_neuroticism",
    ]:
        if user_data.get(field) is None:
            user_data[field] = 0

    return user_data
