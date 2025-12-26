# backend/auth.py
from datetime import datetime, timedelta
from jose import JWTError, jwt # type: ignore
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext

import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_dev_key_if_env_missing")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

security = HTTPBearer()
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(user_id: int):
    expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    payload = {
        "sub": str(user_id), # sub = subject (เจ้าของบัตร)
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=expire_minutes) 
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """ยามเฝ้าประตู: ตรวจบัตรผ่าน"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id) # คืนค่า ID ของคนถือบัตร
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

from sqlmodel import Session, select
from core.database import engine
from models import User

def get_current_user(user_id: int = Security(verify_token)) -> User:
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user

def get_current_admin(user: User = Security(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return user