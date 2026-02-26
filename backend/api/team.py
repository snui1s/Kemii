import json
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from core.auth import get_current_user, verify_token
from core.database import get_session
from data.skills import DEPARTMENTS
from models import Quest, User
from schemas import (
    AnalyzeTeamRequest,
    ConfirmSmartTeamRequest,
    MatchRequest,
    PreviewSmartTeamRequest,
    UserPublic,
)
from services.ai import analyze_match_synergy, generate_team_overview
from services.matching import (
    LAMBDA,
    SCALING_MAX_COST,
    TAU,
    calculate_academic_cost,
    calculate_team_cost,
    cost_to_score,
    get_stats,
    get_team_rating,
)

router = APIRouter()


@router.post("/match-ai")
async def match_users_ai(req: MatchRequest, session: Session = Depends(get_session)):
    u1 = session.get(User, req.user1_id)
    u2 = session.get(User, req.user2_id)

    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="Heroes not found")

    s1 = get_stats(u1)
    s2 = get_stats(u2)
    stats = [s1, s2]

    # Calculate Cost and Score
    cost = calculate_academic_cost(stats)
    denominator = SCALING_MAX_COST
    score_raw = 100 * (1 - (cost / denominator))
    final_score = max(0, min(100, int(round(score_raw))))
    team_rating = get_team_rating(final_score)

    analysis_json = await analyze_match_synergy(u1, u2, s1, s2, final_score)

    # Parse skills for user1
    u1_dict = u1.model_dump()
    u1_skills = (
        json.loads(u1.skills)
        if u1.skills and isinstance(u1.skills, str)
        else (u1.skills if u1.skills else [])
    )
    u1_dict["skills"] = u1_skills
    # Ensure OCEAN defaults
    for f in [
        "ocean_openness",
        "ocean_conscientiousness",
        "ocean_extraversion",
        "ocean_agreeableness",
        "ocean_neuroticism",
    ]:
        if u1_dict.get(f) is None:
            u1_dict[f] = 0

    # Parse skills for user2
    u2_dict = u2.model_dump()
    u2_skills = (
        json.loads(u2.skills)
        if u2.skills and isinstance(u2.skills, str)
        else (u2.skills if u2.skills else [])
    )
    u2_dict["skills"] = u2_skills
    # Ensure OCEAN defaults
    for f in [
        "ocean_openness",
        "ocean_conscientiousness",
        "ocean_extraversion",
        "ocean_agreeableness",
        "ocean_neuroticism",
    ]:
        if u2_dict.get(f) is None:
            u2_dict[f] = 0

    return {
        "user1": u1_dict,
        "user2": u2_dict,
        "ai_analysis": analysis_json,
        "team_rating": team_rating,
        "score": final_score,
    }


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
    try:
        u_skills = (
            json.loads(user.skills) if isinstance(user.skills, str) else user.skills
        )
    except:
        return False

    if not u_skills:
        return False

    for s in u_skills:
        s_name = s.get("name")
        clean_name = (
            s_name.replace("Dept: ", "") if s_name.startswith("Dept: ") else s_name
        )

        if clean_name == dept_name or clean_name in dept_skills:
            return True
    return False


# =========================
# Endpoints
# =========================


@router.post("/teams/preview")
def preview_smart_team(
    req: PreviewSmartTeamRequest, session: Session = Depends(get_session)
):
    # Get head user
    head_user = session.get(User, req.head_id)
    if not head_user:
        raise HTTPException(status_code=400, detail="ไม่พบข้อมูล Project Head (หัวหน้าทีม)")

    if req.candidate_ids:
        all_users = session.exec(
            select(User).where(
                User.id.in_(req.candidate_ids), User.is_available == True
            )
        ).all()
    else:
        all_users = session.exec(select(User).where(User.is_available == True)).all()

    req_pools = []
    for req_item in req.requirements:
        dept_id = req_item.department_id
        dept_info = get_dept_info(dept_id)
        if not dept_info:
            continue

        dept_name = dept_info["name"]
        dept_skills = set(dept_info["skills"])

        pool = [u for u in all_users if user_matches_dept(u, dept_name, dept_skills)]
        # Head is already in the team, shouldn't be in the candidate pool for other slots
        pool = [u for u in pool if u.id != req.head_id]

        if len(pool) < req_item.count:
            # We don't raise HTTPException here because we want to allow partial/failed generation to return empty options smoothly
            print(f"Warning: Not enough candidates for {dept_name}")
            return {"options": []}

        req_pools.append({"dept_id": dept_id, "count": req_item.count, "pool": pool})

    from services.matching import generate_top_teams_iterative

    top_teams_data = generate_top_teams_iterative(head_user, req_pools, top_n=5)

    if not top_teams_data:
        # Check if there are no requirements, in which case returning just the head is valid
        if not req_pools:
            cost = calculate_team_cost([head_user])
            score = cost_to_score(cost) if cost != float("inf") else 0.0
            top_teams_data = [
                {
                    "id": "opt-1-100",
                    "team": [{"user": head_user, "role": "HEAD"}],
                    "harmony_score": score,
                    "raw_kemii_score": cost,
                }
            ]
        else:
            return {"options": []}

    formatted_options = []

    for team_data in top_teams_data:
        result_members = []
        for item in team_data["team"]:
            u = item["user"]
            dept_name = "หัวหน้าทีม (Head)"
            if item["role"] != "HEAD":
                dept_name = next(
                    (d["name"] for d in DEPARTMENTS if d["id"] == item["role"]),
                    item["role"],
                )

            result_members.append(
                {
                    "id": u.id,
                    "name": u.name,
                    "skills": u.skills,
                    "character_class": u.character_class,
                    "level": u.level,
                    "dept_id": item["role"],
                    "dept_name": dept_name,
                    "match_score": 0,
                    "ocean_scores": {
                        "O": u.ocean_openness,
                        "C": u.ocean_conscientiousness,
                        "E": u.ocean_extraversion,
                        "A": u.ocean_agreeableness,
                        "N": u.ocean_neuroticism,
                    },
                    "is_available": u.is_available,
                }
            )

        formatted_options.append(
            {
                "id": team_data["id"],
                "members": result_members,
                "harmony_score": team_data["harmony_score"],
                "raw_kemii_score": team_data["raw_kemii_score"],
            }
        )

    return {"options": formatted_options}


@router.post("/teams/confirm")
def confirm_smart_team(
    req: ConfirmSmartTeamRequest,
    user_id_from_token: str = Depends(verify_token),
    session: Session = Depends(get_session),
):
    # Allow the creator to set anyone as the Project Head (leader_id)
    # The creator's ID (user_id_from_token) is implicitly the one who requested it,
    # but the actual leader can be the selected Project Head.
    # 1. Create Quest

    # Generate department requirements string for storage
    req_skills_list = []
    for r in req.requirements:
        dept_name = next(
            (d["name"] for d in DEPARTMENTS if d["id"] == r.department_id),
            r.department_id,
        )
        # Use Dept: prefix to match the display logic if wanted, or just raw.
        # But previous logic used name directly.
        # Actually in seed/display debugging we found we use raw names.
        req_skills_list.append({"name": dept_name, "level": 1})

    quest = Quest(
        title=req.title,
        description=req.description,
        rank="A",  # Default
        required_skills=json.dumps(req_skills_list),
        ocean_preference=json.dumps({"msg": "Optimized by Golden Formula"}),
        team_size=len(req.member_ids),
        leader_id=req.leader_id,
        start_date=req.start_date,
        deadline=req.deadline,
        status="filled",  # Immediately filled
        accepted_members=json.dumps(req.member_ids),
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


@router.post("/teams/analyze")
async def analyze_team(req: AnalyzeTeamRequest):
    analysis_text = await generate_team_overview(req.dict())
    return {"analysis": analysis_text}
