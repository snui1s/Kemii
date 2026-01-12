from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from core.database import engine
from models import User
from core.auth import get_current_admin
from schemas import RoleUpdate, UserPublic

router = APIRouter(prefix="/admin", tags=["admin"])

# RoleUpdate moved to schemas

@router.put("/users/{user_id}/role", response_model=UserPublic)
def update_user_role(user_id: str, role_data: RoleUpdate, admin: User = Depends(get_current_admin)):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent removing own admin status (safety check) - optional but good practice
        if user.id == admin.id and role_data.role != "admin":
             # Allow but maybe warn? For now let's allow it but UI should handle care.
             pass

        user.role = role_data.role
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin: User = Depends(get_current_admin)):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        session.delete(user)
        session.commit()
        return {"message": "User deleted successfully"}

# ================= SEED LOGIC =================

from core.auth import get_password_hash
from data.skills import DEPARTMENTS
import random
import json

# Thai first names
FIRST_NAMES = [
    "สมชาย", "สมหญิง", "วิชัย", "วิภา", "ประยุทธ์", "ประภา",
    "อนุชา", "อนุรักษ์", "กิตติ", "กิตติยา", "ธนา", "ธนิดา",
    "พิชัย", "พิมพ์", "ศักดิ์", "ศิริ", "สุชาติ", "สุนีย์",
    "อารี", "อารยา", "นพดล", "นพวรรณ", "วัชระ", "วาสนา",
    "ชัยวัฒน์", "ชุติมา", "ภานุ", "ภาวิณี", "ธีระ", "ธีรา",
    "ปรีชา", "ปริญญา", "มานะ", "มาลี", "สราวุธ", "สายฝน",
    "อภิชาติ", "อภิญญา", "วรพล", "วรรณา", "เกียรติ", "เกศริน",
    "ณัฐ", "ณิชา", "ปิยะ", "ปิยนุช", "สุรชัย", "สุรีย์",
    "ดำรง", "ดาวเรือง", "บุญมี", "บุญยง", "รัตน์", "รัชนี"
]

# OCEAN profiles for each character class
# Format: (O, C, E, A, N, class_name)
CLASS_PROFILES = [
    {"class": "Mage",    "o": (40, 50), "c": (20, 35), "e": (15, 30), "a": (25, 40), "n": (15, 30)},  # High O
    {"class": "Paladin", "o": (25, 35), "c": (40, 50), "e": (25, 40), "a": (35, 45), "n": (10, 25)},  # High C
    {"class": "Warrior", "o": (20, 35), "c": (30, 40), "e": (40, 50), "a": (20, 35), "n": (20, 35)},  # High E
    {"class": "Cleric",  "o": (25, 40), "c": (30, 40), "e": (20, 35), "a": (40, 50), "n": (10, 25)},  # High A
    {"class": "Rogue",   "o": (30, 40), "c": (15, 30), "e": (30, 40), "a": (15, 30), "n": (35, 50)},  # High N
]

def get_random_in_range(range_tuple):
    return random.randint(range_tuple[0], range_tuple[1])

# Need additional imports for manual auth check
from fastapi import Header
# Security, HTTPAuthorizationCredentials removed (Unused)
from core.auth import verify_token, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

@router.post("/seed")
def seed_production_data(authorization: str = Header(None)):
    """
    Seed initial users.
    - If DB is EMPTY: No Auth required (Genesis Mode).
    - If DB has users: Requires Admin Token.
    """
    with Session(engine) as session:
        # Check current user count
        all_users = session.exec(select(User)).all()
        existing_count = len(all_users)
        
        # === SECURITY CHECK ===
        if existing_count > 0:
            # Not empty? Must be Admin.
            if not authorization:
                raise HTTPException(status_code=401, detail="Auth required (DB not empty)")
            
            try:
                scheme, token = authorization.split()
                if scheme.lower() != 'bearer':
                    raise HTTPException(status_code=401, detail="Invalid auth scheme")
                
                # Manual Verification
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_id = payload.get("sub")
                if not user_id:
                     raise HTTPException(status_code=401, detail="Invalid token")
                
                admin_user = session.get(User, str(user_id))
                if not admin_user or admin_user.role != "admin":
                    raise HTTPException(status_code=403, detail="Admin privileges required")
                    
            except (ValueError, JWTError):
                 raise HTTPException(status_code=401, detail="Invalid token")

        # === SEEDING LOGIC ===
        created_count = 0
        
        for dept in DEPARTMENTS:
            dept_id = dept["id"]
            dept_name = dept["name"]
            
            # Create 5 users with different character classes
            for i, profile in enumerate(CLASS_PROFILES):
                o = get_random_in_range(profile["o"])
                c = get_random_in_range(profile["c"])
                e = get_random_in_range(profile["e"])
                a = get_random_in_range(profile["a"])
                n = get_random_in_range(profile["n"])
                
                character_class = profile["class"]
                skills_json = [{"name": dept_name, "level": 1}]
                
                name = random.choice(FIRST_NAMES)
                dept_code = dept_id[:3].upper()
                full_name = f"{name} ({dept_code}-{i+1})"
                
                email_idx = existing_count + created_count + 1
                email = f"user{email_idx}@kemii.com"
                
                user = User(
                    name=full_name,
                    email=email,
                    hashed_password=get_password_hash("1234"),
                    character_class=character_class,
                    level=random.randint(1, 5),
                    ocean_openness=o,
                    ocean_conscientiousness=c,
                    ocean_extraversion=e,
                    ocean_agreeableness=a,
                    ocean_neuroticism=n,
                    role="user", # Default to user
                    skills=json.dumps(skills_json, ensure_ascii=False),
                    is_available=True
                )
                session.add(user)
                created_count += 1
                
        # Also ensure we create an Admin if it's the very first run?
        # The script created 'admin@kemii.com' specifically.
        # Let's add that back for Genesis Mode!
        if existing_count == 0:
             admin_user = User(
                name="King Arthur",
                email="admin@kemii.com",
                hashed_password=get_password_hash("admin1234"),
                character_class="Warrior",
                role="admin",
                level=99,
                ocean_openness=50, ocean_conscientiousness=50, ocean_extraversion=50, ocean_agreeableness=50, ocean_neuroticism=50,
                skills=json.dumps([{"name": "Admin", "level": 99}], ensure_ascii=False),
                is_available=True
            )
             session.add(admin_user)
             created_count += 1
             print("👑 Genesis: Created Super Admin")

        session.commit()
    
    return {"message": f"Seeding Complete! Created {created_count} new heroes.", "total_users": existing_count + created_count}
