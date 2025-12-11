# backend/auth.py
from datetime import datetime, timedelta
from jose import JWTError, jwt # type: ignore
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ⚠️ ของจริงควรซ่อนไว้ใน .env นะครับ
SECRET_KEY = "my_super_secret_key_change_this" 
ALGORITHM = "HS256"

security = HTTPBearer()

def create_access_token(user_id: int):
    payload = {
        "sub": str(user_id), # sub = subject (เจ้าของบัตร)
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=365) # บัตรหมดอายุใน 1 ปี (หรือจะไม่ใส่ก็ได้ถ้าอยากให้ใช้ยาวๆ)
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