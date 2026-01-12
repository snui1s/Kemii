from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select, func
from core.database import get_session
from models import User
from schemas import OceanSubmission, UserProfile, UpdateSkillsRequest, UserPublic, UserCandidate
from core.auth import create_access_token, verify_token, get_current_user, get_optional_user
from services.ai import analyze_user_profile
from datetime import datetime
from typing import List, Union, Optional
import json

router = APIRouter()

def check_and_release_users(session: Session):
    busy_users = session.exec(
        select(User).where(User.is_available == False, User.active_project_end_date != None)
    ).all()
    now = datetime.now()
    released_count = 0
    for user in busy_users:
        if user.active_project_end_date and now > user.active_project_end_date:
            user.is_available = True
            user.active_project_end_date = None
            session.add(user)
            released_count += 1

    if released_count > 0:
        session.commit()
        print(f"Auto-released {released_count} heroes from duty.")

def _format_user_safe(u: User, requester_role: str, requester_id: str):
    """
    Internal helper to sanitize user data based on requester's role.
    - Admin: Sees EVERYTHING.
    - Owner: Sees EVERYTHING (their own profile).
    - Guest/Other: See only PUBLIC info (No email, No OCEAN scores if guest, etc).
    """
    is_admin = requester_role == "admin"
    is_owner = u.id == requester_id
    
    # Base public data
    skills = json.loads(u.skills) if u.skills and isinstance(u.skills, str) else (u.skills if u.skills else [])
    
    data = {
        "id": u.id,
        "name": u.name,
        "character_class": u.character_class,
        "level": u.level,
        "skills": skills,
        "is_available": u.is_available,
        "role": u.role
    }

    # Add sensitive data ONLY for Admin or Owner
    if is_admin or is_owner:
        data["email"] = u.email
        data["active_project_end_date"] = u.active_project_end_date
    else:
        # Keep sensitive personal info hidden
        data["email"] = "HIDDEN"
        data["active_project_end_date"] = None
    
    # Expose OCEAN scores for everyone so 'High [Stat]' tags show up in Directory
    # Even guests can see these now to make the landing page look good.
    data["ocean_openness"] = u.ocean_openness or 0
    data["ocean_conscientiousness"] = u.ocean_conscientiousness or 0
    data["ocean_extraversion"] = u.ocean_extraversion or 0
    data["ocean_agreeableness"] = u.ocean_agreeableness or 0
    data["ocean_neuroticism"] = u.ocean_neuroticism or 0

    return data

@router.get("/users")
def get_users(
    offset: int = 0, 
    limit: int = 12, 
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Get all users (Paginated).
    - Everyone (even Guests) can see everyone now.
    - Internal logic handles data masking for privacy.
    """
    # 1. Fetch total count
    total = session.exec(select(func.count(User.id))).one()
    
    # 2. Fetch users in page
    users = session.exec(
        select(User).order_by(User.id.desc()).offset(offset).limit(limit)
    ).all()

    # 3. Format with security rules
    requester_role = current_user.role if current_user else "guest"
    requester_id = current_user.id if current_user else ""

    results = [
        _format_user_safe(u, requester_role, requester_id) 
        for u in users
    ]
    
    return {"users": results, "total": total}

@router.get("/users/roster", response_model=List[UserCandidate])
def get_user_roster(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """
    Get user roster for team building (Public Safe Data).
    - Returns minimal data (UserCandidate).
    - Hides sensitive OCEAN scores and email.
    """
    check_and_release_users(session)
    # Roster is needed for Team Builder, so it must return all available users
    # But we strip sensitive data using UserCandidate schema
    users = session.exec(select(User).where(User.is_available == True).order_by(User.id)).all()
    
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "name": u.name,
            "character_class": u.character_class,
            "level": u.level,
            "is_available": u.is_available,
            "skills": u.skills # Skills are generally public/needed for filtering, but scores are hidden
        })
    return results

@router.get("/users/{user_id}")
def get_user_by_id(
    user_id: str, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Get user by ID.
    - Restricted to Self or Admin only (Least Privilege).
    - If you want to see others, you must use the public /users list.
    """
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Still use the safe formatter just in case (e.g. for owner view vs admin view)
    return _format_user_safe(user, current_user.role, current_user.id)

@router.get("/users/{user_id}/skills")
def get_user_skills(user_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get user's skills (Self or Admin only)"""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    skills = json.loads(user.skills) if user.skills else []
    return {"user_id": user_id, "skills": skills}

@router.put("/users/{user_id}/skills")
def update_user_skills(user_id: str, req: UpdateSkillsRequest, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Update user's skills (Self only)"""
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้อื่น")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Convert to JSON and save
    skills_data = [{"name": s.name, "level": s.level} for s in req.skills]
    user.skills = json.dumps(skills_data, ensure_ascii=False)
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message": "Skills updated", "skills": skills_data}

@router.post("/submit-assessment", response_model=UserProfile)
def submit_assessment(data: OceanSubmission, session: Session = Depends(get_session)):
    # This is for GUEST registration, so no auth required
    scores = {
        "Mage": data.openness,
        "Paladin": data.conscientiousness,
        "Warrior": data.extraversion,
        "Cleric": data.agreeableness,
        "Rogue": data.neuroticism
    }
    best_class = max(scores, key=scores.get)

    new_hero = User(
        name=data.name or f"Guest Hero {datetime.now().strftime('%M%S')}",
        character_class=best_class,
        level=1,
        ocean_openness=data.openness,
        ocean_conscientiousness=data.conscientiousness,
        ocean_extraversion=data.extraversion,
        ocean_agreeableness=data.agreeableness,
        ocean_neuroticism=data.neuroticism,
        analysis_result=None # เคลียร์ค่าเก่า (ถ้ามี)
    )

    session.add(new_hero)
    session.commit()
    session.refresh(new_hero)
    token = create_access_token(new_hero.id)

    return {
        "id": new_hero.id,
        "name": new_hero.name,
        "character_class": new_hero.character_class,
        "level": new_hero.level,
        "ocean_scores": {
            "Openness": new_hero.ocean_openness,
            "Conscientiousness": new_hero.ocean_conscientiousness,
            "Extraversion": new_hero.ocean_extraversion,
            "Agreeableness": new_hero.ocean_agreeableness,
            "Neuroticism": new_hero.ocean_neuroticism
        },
        "access_token": token
    }

@router.get("/users/{user_id}/analysis")
async def get_user_analysis(user_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get AI Analysis (Self or Admin only)"""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Hero not found")

    # สร้าง user_data dict เพื่อให้ serialize ถูกต้อง
    user_data = {
        "id": user.id,
        "name": user.name,
        "character_class": user.character_class,
        "level": user.level,
        "ocean_scores": {
            "Openness": user.ocean_openness,
            "Conscientiousness": user.ocean_conscientiousness,
            "Extraversion": user.ocean_extraversion,
            "Agreeableness": user.ocean_agreeableness,
            "Neuroticism": user.ocean_neuroticism
        },
    }

    # 1. เช็คว่ามีผลวิเคราะห์ใน DB หรือยัง? (Caching)
    if user.analysis_result:
        try:
            ai_data = json.loads(user.analysis_result)
            return {
                "user": user_data,
                "analysis": ai_data
            }
        except:
            pass # ถ้า JSON พัง ให้เจนใหม่

    # 2. ถ้ายังไม่มี -> เรียก AI
    print(f"Summoning AI for {user.name}...")
    ai_data = await analyze_user_profile(user)

    # Save to DB
    user.analysis_result = json.dumps(ai_data, ensure_ascii=False)
    session.add(user)
    session.commit()

    return {
        "user": user_data,
        "analysis": ai_data
    }

@router.post("/users/me/assessment", response_model=UserProfile)
def submit_my_assessment(data: OceanSubmission, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    scores = {
        "Mage": data.openness,
        "Paladin": data.conscientiousness,
        "Warrior": data.extraversion,
        "Cleric": data.agreeableness,
        "Rogue": data.neuroticism
    }
    best_class = max(scores, key=scores.get)
    
    # Update Stats
    current_user.ocean_openness = data.openness
    current_user.ocean_conscientiousness = data.conscientiousness
    current_user.ocean_extraversion = data.extraversion
    current_user.ocean_agreeableness = data.agreeableness
    current_user.ocean_neuroticism = data.neuroticism
    current_user.character_class = best_class
    current_user.analysis_result = None # Clear old analysis
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return {
        "id": current_user.id,
        "name": current_user.name,
        "character_class": current_user.character_class,
        "level": current_user.level,
        "ocean_scores": {
            "Openness": current_user.ocean_openness,
            "Conscientiousness": current_user.ocean_conscientiousness,
            "Extraversion": current_user.ocean_extraversion,
            "Agreeableness": current_user.ocean_agreeableness,
            "Neuroticism": current_user.ocean_neuroticism
        },
        "access_token": "" # No new token needed
    }
