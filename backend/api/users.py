import json
from datetime import datetime
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, func, select

from core.auth import (
    create_access_token,
    get_current_user,
    get_optional_user,
    verify_token,
)
from core.database import get_session
from models import User
from schemas import (
    OceanSubmission,
    UpdateSkillsRequest,
    UserCandidate,
    UserListResponse,
    UserProfile,
    UserPublic,
)
from services.ai import analyze_user_profile

router = APIRouter()


def check_and_release_users(session: Session):
    busy_users = session.exec(
        select(User).where(
            User.is_available == False, User.active_project_end_date != None
        )
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
    """Sanitize user data based on role (Admin/Owner vs Public)."""
    is_admin = requester_role == "admin"
    is_owner = u.id == requester_id

    # Base public data
    skills = (
        json.loads(u.skills)
        if u.skills and isinstance(u.skills, str)
        else (u.skills if u.skills else [])
    )

    data = {
        "id": u.id,
        "name": u.name,
        "character_class": u.character_class,
        "level": u.level,
        "skills": skills,
        "is_available": u.is_available,
        "role": u.role,
    }

    if is_admin or is_owner:
        data["email"] = u.email
        data["active_project_end_date"] = u.active_project_end_date
    else:
        data["email"] = "HIDDEN"
        data["active_project_end_date"] = None

    # Expose OCEAN scores for everyone
    data["ocean_openness"] = u.ocean_openness or 0
    data["ocean_conscientiousness"] = u.ocean_conscientiousness or 0
    data["ocean_extraversion"] = u.ocean_extraversion or 0
    data["ocean_agreeableness"] = u.ocean_agreeableness or 0
    data["ocean_neuroticism"] = u.ocean_neuroticism or 0

    return data


@router.get("/users", response_model=UserListResponse)
def get_users(
    offset: int = 0,
    limit: int = 12,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get all users (Paginated)."""
    total = session.exec(select(func.count(User.id))).one()

    users = session.exec(
        select(User).order_by(User.id.desc()).offset(offset).limit(limit)
    ).all()

    requester_role = current_user.role if current_user else "guest"
    requester_id = current_user.id if current_user else ""

    results = [_format_user_safe(u, requester_role, requester_id) for u in users]

    return {"users": results, "total": total}


@router.get("/users/roster", response_model=List[UserCandidate])
def get_user_roster(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get user roster for team building (Public Safe Data)."""
    check_and_release_users(session)
    users = session.exec(
        select(User).where(User.is_available == True).order_by(User.id)
    ).all()

    results = []
    for u in users:
        skills_parsed = (
            json.loads(u.skills)
            if u.skills and isinstance(u.skills, str)
            else (u.skills if u.skills else [])
        )
        results.append(
            {
                "id": u.id,
                "name": u.name,
                "character_class": u.character_class,
                "level": u.level,
                "is_available": u.is_available,
                "skills": skills_parsed,
            }
        )
    return results


@router.get("/users/{user_id}", response_model=UserPublic)
def get_user_by_id(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get user by ID (Self or Admin only)."""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return _format_user_safe(user, current_user.role, current_user.id)


@router.get("/users/{user_id}/skills")
def get_user_skills(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get user's skills (Self or Admin only)"""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    skills = json.loads(user.skills) if user.skills else []
    return {"user_id": user_id, "skills": skills}


@router.put("/users/{user_id}/skills")
def update_user_skills(
    user_id: str,
    req: UpdateSkillsRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
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
    # Guest registration
    scores = {
        "Mage": data.openness,
        "Paladin": data.conscientiousness,
        "Warrior": data.extraversion,
        "Cleric": data.agreeableness,
        "Rogue": data.neuroticism,
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
        analysis_result=None,
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
            "Neuroticism": new_hero.ocean_neuroticism,
        },
        "access_token": token,
    }


@router.get("/users/{user_id}/analysis")
async def get_user_analysis(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get AI Analysis (Self or Admin only)"""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Hero not found")

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
            "Neuroticism": user.ocean_neuroticism,
        },
    }

    if user.analysis_result:
        try:
            ai_data = json.loads(user.analysis_result)
            return {"user": user_data, "analysis": ai_data}
        except:
            pass

    print(f"Summoning AI for {user.name}...")
    ai_data = await analyze_user_profile(user)

    user.analysis_result = json.dumps(ai_data, ensure_ascii=False)
    session.add(user)
    session.commit()

    return {"user": user_data, "analysis": ai_data}


@router.post("/users/me/assessment", response_model=UserProfile)
def submit_my_assessment(
    data: OceanSubmission,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    scores = {
        "Mage": data.openness,
        "Paladin": data.conscientiousness,
        "Warrior": data.extraversion,
        "Cleric": data.agreeableness,
        "Rogue": data.neuroticism,
    }
    best_class = max(scores, key=scores.get)

    # Update Stats
    current_user.ocean_openness = data.openness
    current_user.ocean_conscientiousness = data.conscientiousness
    current_user.ocean_extraversion = data.extraversion
    current_user.ocean_agreeableness = data.agreeableness
    current_user.ocean_neuroticism = data.neuroticism
    current_user.character_class = best_class
    current_user.analysis_result = None  # Clear old analysis

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
            "Neuroticism": current_user.ocean_neuroticism,
        },
        "access_token": "",  # No new token needed
    }
