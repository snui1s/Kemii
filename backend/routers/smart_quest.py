from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from database import get_session
from models import User, Quest
from schemas import PreviewSmartTeamRequest, ConfirmSmartTeamRequest, AnalyzeTeamRequest
from skills_data import DEPARTMENTS
from services.matching import calculate_team_cost, cost_to_score
from services.ai import generate_team_overview
import json
import random
from datetime import datetime

router = APIRouter()

# =========================
# Utility
# =========================
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
    # OR if they belong to the department directly
    for s in u_skills:
        s_name = s.get("name")
        # Handle "Dept: " prefix
        clean_name = s_name.replace("Dept: ", "") if s_name.startswith("Dept: ") else s_name
        
        if clean_name == dept_name or clean_name in dept_skills:
            return True
    return False

# =========================
# Endpoints
# =========================

@router.post("/quests/smart/preview")
def preview_smart_team(req: PreviewSmartTeamRequest, session: Session = Depends(get_session)):
    
    # 1. Get all available users
    if req.candidate_ids:
        # Enforce availability check even if IDs are provided
        all_users = session.exec(select(User).where(User.id.in_(req.candidate_ids), User.is_available == True)).all()
    else:
        all_users = session.exec(select(User).where(User.is_available == True)).all()
    
    # Pre-filter candidates for each requirement to allow structure-aware sampling
    req_pools = []
    for req_item in req.requirements:
        dept_id = req_item.department_id
        dept_info = get_dept_info(dept_id)
        if not dept_info: continue
        
        dept_name = dept_info["name"]
        dept_skills = set(dept_info["skills"])
        
        pool = [u for u in all_users if user_matches_dept(u, dept_name, dept_skills)]
        if len(pool) < req_item.count:
            error_msg = f"ผู้สมัครไม่เพียงพอสำหรับ {dept_name} (ต้องการ {req_item.count}, มี {len(pool)})"
            print(f"[DEBUG] !!! {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        req_pools.append({
            "dept_id": dept_id,
            "count": req_item.count,
            "pool": pool
        })

    best_team = None
    best_cost = float('inf')
    
    iterations = 1000
    print(f"[DEBUG] Starting Monte Carlo Simulation: {iterations} iterations")
    
    for i in range(iterations):
        current_team = []
        used_ids = set()
        possible = True
        
        for item in req_pools:
            pool = item["pool"]
            count = item["count"]
            
            # Filter available for this slot
            available = [u for u in pool if u.id not in used_ids]
            
            if len(available) < count:
                possible = False
                break
                
            # Randomly select 'count' users (Structure-aware random sampling)
            picked = random.sample(available, count)
            for p in picked:
                current_team.append({"user": p, "role": item["dept_id"]})
                used_ids.add(p.id)
        
        if possible and current_team:
            team_users = [t["user"] for t in current_team]
            cost = calculate_team_cost(team_users)
            
            if i % 100 == 0:
                 print(f"[DEBUG] Iteration {i}: Cost={cost:.4f}, Members={[u.name for u in team_users]}")
            
            if cost < best_cost:
                print(f"[DEBUG] >>> New Best Found at Iteration {i}: Cost={cost:.4f} (Score: {cost_to_score(cost)})")
                print(f"[DEBUG]     Team: {[u.name for u in team_users]}")
                best_cost = cost
                best_team = current_team

    # Fallback if no valid team found at all
    selected_team = best_team if best_team else []
    
    if selected_team:
        team_score = cost_to_score(best_cost)
    else:
        team_score = 0.0
        best_cost = 0.0

    # Format result for Frontend
    result_members = []
    for item in selected_team:
        u = item["user"]
        result_members.append({
            "id": u.id,
            "name": u.name,
            "skills": u.skills,
            "character_class": u.character_class,
            "level": u.level,
            "dept_id": item["role"],
            "dept_name": next((d["name"] for d in DEPARTMENTS if d["id"] == item["role"]), item["role"]),
            "match_score": 0,
            "ocean_scores": {
                "O": u.ocean_openness, "C": u.ocean_conscientiousness,
                "E": u.ocean_extraversion, "A": u.ocean_agreeableness,
                "N": u.ocean_neuroticism
            },
            "is_available": u.is_available
        })

    return {
        "members": result_members,
        "harmony_score": team_score,
        "raw_kemii_score": best_cost # Keeping this for debug if needed, though mapped to team_cost in user snippet
    }

@router.post("/quests/smart/confirm")
def confirm_smart_team(req: ConfirmSmartTeamRequest, session: Session = Depends(get_session)):
    # 1. Create Quest
    
    # Generate department requirements string for storage
    req_skills_list = []
    for r in req.requirements:
        dept_name = next((d["name"] for d in DEPARTMENTS if d["id"] == r.department_id), r.department_id)
        # Use Dept: prefix to match the display logic if wanted, or just raw. 
        # But previous logic used name directly. 
        # Actually in seed/display debugging we found we use raw names.
        req_skills_list.append({"name": dept_name, "level": 1})
    
    quest = Quest(
        title=req.title,
        description=req.description,
        rank="A", # Default
        required_skills=json.dumps(req_skills_list),
        ocean_preference=json.dumps({"msg": "Optimized by Golden Formula"}),
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

@router.post("/quests/smart/analyze")
async def analyze_team(req: AnalyzeTeamRequest):
    analysis_text = await generate_team_overview(req.dict())
    return {"analysis": analysis_text}
