from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from database import get_session
from models import User, Quest
from schemas import PreviewSmartTeamRequest, ConfirmSmartTeamRequest, SmartQuestRequirement
from skills_data import DEPARTMENTS
import json
import random
import statistics
from datetime import datetime

router = APIRouter()

# --- Helper Logic (Ported from test.py) ---

def get_dept_info(dept_id):
    for d in DEPARTMENTS:
        if d["id"] == dept_id:
            return d
    return None

def user_matches_dept(user: User, dept_name: str, dept_skills: set) -> bool:
    if not user.skills:
        return False
    # Handle string or list/dict
    try:
        u_skills = json.loads(user.skills) if isinstance(user.skills, str) else user.skills
    except:
        return False
        
    if not u_skills: 
        return False

    # Check if user has at least one skill from the department 
    # OR if they belong to the department directly (new logic)
    for s in u_skills:
        # s is dict {"name": "...", "level": ...}
        s_name = s.get("name")
        if s_name == dept_name or s_name in dept_skills:
            return True
    return False

def calculate_kemii_score(users: list[User]) -> float:
    """
    Kemii's Golden Formula for Team Harmony
    Lower score = Better harmony
    """
    if not users or len(users) < 2:
        return 0.0

    # Extract OCEAN values (default to 25 if 0/None)
    c_vals = [u.ocean_conscientiousness or 25 for u in users]
    a_vals = [u.ocean_agreeableness or 25 for u in users]
    e_vals = [u.ocean_extraversion or 25 for u in users]
    o_vals = [u.ocean_openness or 25 for u in users]
    n_vals = [u.ocean_neuroticism or 25 for u in users]

    def get_norm_var(values):
        try:
             # pvariance requires at least one data point, but we checked len >= 2
            var = statistics.pvariance(values)
        except:
            var = 0
        return var / 400.0 # Normalize by max variant (approx)

    def get_norm_mean(values):
        avg = statistics.mean(values)
        return (avg - 10) / 40.0

    # 1. Core Compatibility (Weight 1.5)
    term_c = 1.5 * get_norm_var(c_vals)
    term_a_var = 1.5 * get_norm_var(a_vals)

    # 2. Style Compatibility (Weight 1.0)
    term_e = 1.0 * get_norm_var(e_vals)
    term_o = 1.0 * get_norm_var(o_vals)

    # 3. Stress Level (Weight 1.0)
    term_n = 1.0 * get_norm_mean(n_vals)

    # 4. Toxic Penalty (Weight 2.0)
    avg_a_norm = get_norm_mean(a_vals)
    tau = 0.5
    term_penalty = 2.0 * max(0, tau - avg_a_norm)

    return term_c + term_a_var + term_e + term_o + term_n + term_penalty

# --- Endpoints ---

@router.post("/quests/smart/preview")
def preview_smart_team(req: PreviewSmartTeamRequest, session: Session = Depends(get_session)):
    # 1. Get all available users
    all_users = session.exec(select(User).where(User.is_available == True)).all()
    
    selected_team = []
    used_user_ids = set() # Track used IDs to prevent duplicates
    
    # 2. Select users for each requirement
    # Shuffle entire pool first for randomness
    available_pool = list(all_users)
    random.shuffle(available_pool)
    
    for req_item in req.requirements:
        dept_id = req_item.department_id
        count = req_item.count
        
        dept_info = get_dept_info(dept_id)
        if not dept_info:
            continue # Skip invalid dept
        
        dept_name = dept_info["name"]
        dept_skills = set(dept_info["skills"])
            
        # Find matching candidates who HAVEN'T been picked yet
        candidates = []
        for u in available_pool:
            if u.id not in used_user_ids and user_matches_dept(u, dept_name, dept_skills):
                candidates.append(u)
        
        # Sort candidates by "Skill Power"
        def skill_power(u):
            score = 0
            try:
                u_skills = json.loads(u.skills) if isinstance(u.skills, str) else u.skills
            except:
                u_skills = []
            
            if not u_skills: return 0
            
            for s in u_skills:
                s_name = s.get("name")
                # Give huge bonus if they are in the Dept directly (new logic)
                if s_name == dept_name:
                    score += 10 
                elif s_name in dept_skills:
                    score += s.get("level", 0)
            return score
            
        candidates.sort(key=skill_power, reverse=True)
        
        # Pick top 'count'
        picked = candidates[:count]
        
        # Add to team
        for p in picked:
            selected_team.append({
                "user": p,
                "role": dept_id,
                "skill_power": skill_power(p)
            })
            used_user_ids.add(p.id) # Mark as used

    # 3. Simple Optimization: Calculate Score
    team_users = [item["user"] for item in selected_team]
    harmony_score = calculate_kemii_score(team_users)
    
    # Convert score to 0-100 (inverse)
    display_harmony = max(0, int(100 - (harmony_score * 30)))
    
    result_members = []
    for item in selected_team:
        u = item["user"]
        result_members.append({
            "id": u.id,
            "name": u.name,
            "character_class": u.character_class,
            "level": u.level,
            "dept_id": item["role"],
            "dept_name": next((d["name"] for d in DEPARTMENTS if d["id"] == item["role"]), item["role"]),
            "match_score": 0,
            "ocean_scores": {
                "O": u.ocean_openness, "C": u.ocean_conscientiousness,
                "E": u.ocean_extraversion, "A": u.ocean_agreeableness,
                "N": u.ocean_neuroticism
            }
        })

    return {
        "members": result_members,
        "harmony_score": display_harmony,
        "raw_kemii_score": harmony_score
    }

@router.post("/quests/smart/confirm")
def confirm_smart_team(req: ConfirmSmartTeamRequest, session: Session = Depends(get_session)):
    # 1. Create Quest
    
    # Generate department requirements string for storage
    req_skills_list = []
    for r in req.requirements:
        dept_name = next((d["name"] for d in DEPARTMENTS if d["id"] == r.department_id), r.department_id)
        req_skills_list.append({"name": f"Dept: {dept_name}", "level": 1})
    
    quest = Quest(
        title=req.title,
        description=f"Auto-generated smart quest for {len(req.member_ids)} members (Locked).",
        rank="A", # Default
        required_skills=json.dumps(req_skills_list),
        optional_skills="[]",
        ocean_preference=json.dumps({"msg": "Auto-balanced by Kemii Formula"}),
        team_size=len(req.member_ids),
        leader_id=req.leader_id,
        start_date=req.start_date,
        deadline=req.deadline,
        status="filled", # Immediately filled
        accepted_members=json.dumps(req.member_ids)
    )
    
    session.add(quest)
    session.commit()
    session.refresh(quest)
    
    # 2. Update Users (Lock them)
    for uid in req.member_ids:
        u = session.get(User, uid)
        if u:
            u.is_available = False
            session.add(u)
    
    session.commit()
    
    return {"message": "Quest created and team assigned.", "quest_id": quest.id}
