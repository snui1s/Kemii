from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from database import get_session
from models import User
from schemas import OceanSubmission, UserProfile, UpdateSkillsRequest
from auth import create_access_token, verify_token
from services.ai import analyze_user_profile
from datetime import datetime
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

@router.get("/users")
def get_users(session: Session = Depends(get_session)):
    # ดึงข้อมูลทั้งหมด เรียงตาม ID ล่าสุด
    users = session.exec(select(User).order_by(User.id.desc())).all()

    results = []
    for u in users:
        skills = json.loads(u.skills) if u.skills else []
        results.append({
            "id": u.id,
            "name": u.name,
            "character_class": u.character_class,
            "level": u.level,
            "ocean_openness": u.ocean_openness or 0,
            "ocean_conscientiousness": u.ocean_conscientiousness or 0,
            "ocean_extraversion": u.ocean_extraversion or 0,
            "ocean_agreeableness": u.ocean_agreeableness or 0,
            "ocean_neuroticism": u.ocean_neuroticism or 0,
            "skills": skills,
            "is_available": u.is_available,
            "role": u.role
        })
    return results

@router.get("/users/roster")
def get_user_roster(session: Session = Depends(get_session)):
    """Get user roster for team building"""
    check_and_release_users(session)
    users = session.exec(select(User).order_by(User.is_available.desc(), User.id)).all()
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "name": u.name,
            "character_class": u.character_class,
            "dominant_type": f"Lv.{u.level}",
            "scores": {
                "Openness": u.ocean_openness or 0,
                "Conscientiousness": u.ocean_conscientiousness or 0,
                "Extraversion": u.ocean_extraversion or 0,
                "Agreeableness": u.ocean_agreeableness or 0,
                "Neuroticism": u.ocean_neuroticism or 0
            },
            "is_available": u.is_available,
            "active_project_end_date": u.active_project_end_date
        })
    return results

@router.get("/users/{user_id}")
def get_user_by_id(user_id: int, session: Session = Depends(get_session)):
    """Get user by ID"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users/{user_id}/skills")
def get_user_skills(user_id: int, session: Session = Depends(get_session)):
    """Get user's skills"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    skills = json.loads(user.skills) if user.skills else []
    return {"user_id": user_id, "skills": skills}

@router.put("/users/{user_id}/skills")
def update_user_skills(user_id: int, req: UpdateSkillsRequest, session: Session = Depends(get_session)):
    """Update user's skills"""
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
async def get_user_analysis(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    print(f"DEBUG: Analyzing user {user_id}. Found? {user is not None}")
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
            print(f"✨ Load AI Analysis for {user.name} from DB")
            print(f"   📦 character_class = {user.character_class}")
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

    # ... existing code ...
    return {
        "user": user_data,
        "analysis": ai_data
    }

@router.post("/users/me/assessment", response_model=UserProfile)
def submit_my_assessment(data: OceanSubmission, user_id: int = Depends(verify_token), session: Session = Depends(get_session)):
    scores = {
        "Mage": data.openness,
        "Paladin": data.conscientiousness,
        "Warrior": data.extraversion,
        "Cleric": data.agreeableness,
        "Rogue": data.neuroticism
    }
    best_class = max(scores, key=scores.get)
    
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update Stats
    user.ocean_openness = data.openness
    user.ocean_conscientiousness = data.conscientiousness
    user.ocean_extraversion = data.extraversion
    user.ocean_agreeableness = data.agreeableness
    user.ocean_neuroticism = data.neuroticism
    user.character_class = best_class
    user.analysis_result = None # Clear old analysis
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {
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
        "access_token": "" # No new token needed, consumer ignores or optional
    }
