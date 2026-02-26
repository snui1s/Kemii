from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from core.database import get_session
from core.auth import verify_token
from models import Quest, User
from schemas import UpdateStatusRequest, QuestResponse, QuestListResponse
from services.matching import calculate_match_score, evaluate_team
from datetime import datetime
from data.skills import DEPARTMENTS
import json

router = APIRouter()


@router.get("/quests", response_model=QuestListResponse)
def get_quests(status: str = None, session: Session = Depends(get_session)):
    """Get all quests, optionally filtered by status."""
    if status:
        quests = session.exec(select(Quest).where(Quest.status == status)).all()
    else:
        quests = session.exec(select(Quest)).all()

    result = []
    for q in quests:
        leader = session.get(User, q.leader_id)

        quest_dict = {
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "rank": q.rank,
            "required_skills": json.loads(q.required_skills),
            "ocean_preference": json.loads(q.ocean_preference),
            "team_size": q.team_size,
            "leader_id": q.leader_id,
            "leader_name": leader.name if leader else "Unknown",
            "leader_class": leader.character_class if leader else "Novice",
            "status": q.status,
            "applicant_count": 0,
            "start_date": q.start_date.isoformat() if q.start_date else None,
            "deadline": q.deadline.isoformat() if q.deadline else None,
            "created_at": q.created_at.isoformat(),
            "harmony_score": 0,
        }

        accepted_ids = json.loads(q.accepted_members) if q.accepted_members else []
        if accepted_ids and leader:
            team_users = [leader]
            for uid in accepted_ids:
                u = session.get(User, uid)
                if u:
                    team_users.append(u)

            if len(team_users) >= 2:
                eval_result = evaluate_team(team_users)
                quest_dict["harmony_score"] = int(round(eval_result["score"]))

        result.append(quest_dict)

    return {"quests": result}


@router.get("/quests/{quest_id}", response_model=QuestResponse)
def get_quest_detail(quest_id: str, session: Session = Depends(get_session)):
    """Get quest details."""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    leader = session.get(User, quest.leader_id)
    accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []

    accepted_members = []
    req_skills = json.loads(quest.required_skills)

    for uid in accepted_ids:
        user = session.get(User, uid)
        if user:
            user_skills = json.loads(user.skills) if user.skills else []
            user_skill_map = {s["name"]: s["level"] for s in user_skills}

            matching = []
            for req in req_skills:
                if req["name"] in user_skill_map:
                    matching.append(
                        {
                            "name": req["name"],
                            "level": user_skill_map[req["name"]],
                            "type": "required",
                        }
                    )

            matching.sort(key=lambda x: x["level"], reverse=True)

            department = "Unknown"
            dept_names = [d["name"] for d in DEPARTMENTS]
            for s in user_skills:
                if s["name"] in dept_names:
                    department = s["name"]
                    break

            accepted_members.append(
                {
                    "id": user.id,
                    "name": user.name,
                    "character_class": user.character_class,
                    "department": department,
                    "level": user.level,
                    "matching_skills": matching,
                }
            )

    return {
        "id": quest.id,
        "title": quest.title,
        "description": quest.description,
        "rank": quest.rank,
        "required_skills": json.loads(quest.required_skills),
        "optional_skills": [],
        "ocean_preference": json.loads(quest.ocean_preference),
        "team_size": quest.team_size,
        "leader_id": quest.leader_id,
        "leader_name": leader.name if leader else "Unknown",
        "leader_class": leader.character_class if leader else "Novice",
        "status": quest.status,
        "applicants": [],
        "accepted_members": accepted_members,
        "accepted_member_ids": accepted_ids,
        "start_date": quest.start_date.isoformat() if quest.start_date else None,
        "deadline": quest.deadline.isoformat() if quest.deadline else None,
        "created_at": quest.created_at.isoformat(),
    }


# Unused Endpoint
# @router.patch("/quests/{quest_id}/team-size")
# def update_quest_team_size(quest_id: str, team_size: int, user_id_from_token: str = Depends(verify_token), session: Session = Depends(get_session)):
#     """Update quest team size (leader only)."""
#     quest = session.get(Quest, quest_id)
#     if not quest:
#         raise HTTPException(status_code=404, detail="Quest not found")
#
#     if quest.leader_id != user_id_from_token:
#         raise HTTPException(status_code=403, detail="เฉพาะหัวหน้าทีมเท่านั้นที่แก้ไขได้")
#
#     if quest.status not in ["open", "filled"]:
#         raise HTTPException(status_code=400, detail="Cannot change team size for started/completed quests")
#
#     accepted_count = len(json.loads(quest.accepted_members)) if quest.accepted_members else 0
#     if team_size < accepted_count:
#         raise HTTPException(status_code=400, detail=f"Cannot reduce below {accepted_count} accepted members")
#
#     if team_size < 1 or team_size > 10:
#         raise HTTPException(status_code=400, detail="Team size must be between 1 and 10")
#
#     quest.team_size = team_size
#
#     if accepted_count >= team_size:
#         quest.status = "filled"
#     else:
#         quest.status = "open"
#
#     session.add(quest)
#     session.commit()
#     session.refresh(quest)
#
#     return {
#         "message": f"Team size updated to {team_size}",
#         "team_size": quest.team_size,
#         "status": quest.status
#     }


@router.get("/quests/{quest_id}/team-analysis")
def get_team_analysis(quest_id: str, session: Session = Depends(get_session)):
    """Analyze team compatibility and skill coverage."""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []
    if not accepted_ids:
        return {"has_team": False}

    required_skills = (
        json.loads(quest.required_skills)
        if isinstance(quest.required_skills, str)
        else quest.required_skills
    )

    team_skills = {}
    team_ocean = {"O": [], "C": [], "E": [], "A": [], "N": []}

    for uid in accepted_ids:
        user = session.get(User, uid)
        if user:
            user_skills = json.loads(user.skills) if user.skills else []
            for s in user_skills:
                skill_name = s.get("name", "")
                skill_level = s.get("level", 0)
                if (
                    skill_name not in team_skills
                    or skill_level > team_skills[skill_name]
                ):
                    team_skills[skill_name] = skill_level

            team_ocean["O"].append(user.ocean_openness or 25)
            team_ocean["C"].append(user.ocean_conscientiousness or 25)
            team_ocean["E"].append(user.ocean_extraversion or 25)
            team_ocean["A"].append(user.ocean_agreeableness or 25)
            team_ocean["N"].append(user.ocean_neuroticism or 25)

    covered_skills = []
    missing_skills = []
    partial_skills = []

    for req in required_skills:
        skill_name = req["name"]
        required_level = req["level"]
        team_level = team_skills.get(skill_name, 0)

        if team_level >= required_level:
            covered_skills.append(
                {"name": skill_name, "required": required_level, "has": team_level}
            )
        elif team_level > 0:
            partial_skills.append(
                {"name": skill_name, "required": required_level, "has": team_level}
            )
        else:
            missing_skills.append({"name": skill_name, "required": required_level})

    total_skills = len(required_skills)
    coverage_percent = int((len(covered_skills) / max(total_skills, 1)) * 100)

    team_users = []
    leader = session.get(User, quest.leader_id)
    if leader:
        team_users.append(leader)

    for uid in accepted_ids:
        u = session.get(User, uid)
        if u:
            team_users.append(u)

    harmony_score = 0
    if len(team_users) >= 2:
        eval_result = evaluate_team(team_users)
        harmony_score = int(round(eval_result["score"]))

    return {
        "has_team": True,
        "member_count": len(accepted_ids),
        "skill_coverage": {
            "covered": covered_skills,
            "partial": partial_skills,
            "missing": missing_skills,
            "coverage_percent": coverage_percent,
            "all_covered": len(missing_skills) == 0 and len(partial_skills) == 0,
        },
        "harmony_score": harmony_score,
        "team_ocean": {
            "O": (
                int(sum(team_ocean["O"]) / len(team_ocean["O"]))
                if team_ocean["O"]
                else 0
            ),
            "C": (
                int(sum(team_ocean["C"]) / len(team_ocean["C"]))
                if team_ocean["C"]
                else 0
            ),
            "E": (
                int(sum(team_ocean["E"]) / len(team_ocean["E"]))
                if team_ocean["E"]
                else 0
            ),
            "A": (
                int(sum(team_ocean["A"]) / len(team_ocean["A"]))
                if team_ocean["A"]
                else 0
            ),
            "N": (
                int(sum(team_ocean["N"]) / len(team_ocean["N"]))
                if team_ocean["N"]
                else 0
            ),
        },
    }


# Unused Endpoint
# @router.get("/quests/{quest_id}/match/{user_id}")
# def get_quest_match_score(
#     quest_id: str,
#     user_id: str,
#     session: Session = Depends(get_session),
#     user_id_token: str = Depends(verify_token)
# ):
#     """Calculate match score (Self only)."""
#     if user_id != user_id_token:
#         raise HTTPException(status_code=403, detail="Permission denied")
#
#     quest = session.get(Quest, quest_id)
#     if not quest:
#         raise HTTPException(status_code=404, detail="Quest not found")
#
#     user = session.get(User, user_id)
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#
#     user_skills = json.loads(user.skills) if user.skills else []
#     user_ocean = {
#         "ocean_openness": user.ocean_openness,
#         "ocean_conscientiousness": user.ocean_conscientiousness,
#         "ocean_extraversion": user.ocean_extraversion,
#         "ocean_agreeableness": user.ocean_agreeableness,
#         "ocean_neuroticism": user.ocean_neuroticism
#     }
#
#     return calculate_match_score(user_skills, user_ocean, quest)


@router.post("/quests/{quest_id}/kick/{user_id}")
def kick_member(
    quest_id: str,
    user_id: str,
    user_id_from_token: str = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Remove a member (leader only)."""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.leader_id != user_id_from_token:
        raise HTTPException(status_code=403, detail="เฉพาะหัวหน้าทีมเท่านั้นที่ปลดสมาชิกได้")

    if quest.status not in ["open", "filled"]:
        raise HTTPException(
            status_code=400, detail="Cannot kick members from started/completed quests"
        )

    accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []

    if user_id not in accepted_ids:
        raise HTTPException(status_code=400, detail="User is not a team member")

    accepted_ids.remove(user_id)
    quest.accepted_members = json.dumps(accepted_ids)

    user = session.get(User, user_id)
    if user:
        user.is_available = True
        user.active_project_end_date = None
        session.add(user)

    if len(accepted_ids) < quest.team_size:
        quest.status = "open"

    session.add(quest)
    session.commit()

    return {"message": f"ปลดสมาชิกแล้ว", "remaining_members": len(accepted_ids)}


@router.post("/quests/{quest_id}/status")
def update_quest_status(
    quest_id: str,
    req: UpdateStatusRequest,
    user_id_from_token: str = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Update quest status (leader only)."""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.leader_id != user_id_from_token:
        raise HTTPException(status_code=403, detail="เฉพาะหัวหน้าทีมเท่านั้นที่เปลี่ยนสถานะได้")

    if req.status not in ["open", "filled", "in_progress", "completed", "failed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    quest.status = req.status

    if req.status in ["completed", "failed"]:
        accepted_ids = (
            json.loads(quest.accepted_members) if quest.accepted_members else []
        )
        for uid in accepted_ids:
            user = session.get(User, uid)
            if user:
                user.is_available = True
                user.active_project_end_date = None
                session.add(user)

    elif req.status == "in_progress":
        quest.start_date = datetime.utcnow()

    session.add(quest)
    session.commit()

    return {"message": "Status updated", "status": quest.status}


# Unused Endpoint
# @router.post("/quests/{quest_id}/accept/{user_id}")
# def accept_applicant(quest_id: str, user_id: str, user_id_from_token: str = Depends(verify_token), session: Session = Depends(get_session)):
#     """Accept an applicant (leader only)."""
#     quest = session.get(Quest, quest_id)
#     if not quest:
#         raise HTTPException(status_code=404, detail="Quest not found")
#
#     if quest.leader_id != user_id_from_token:
#         raise HTTPException(status_code=403, detail="เฉพาะหัวหน้าทีมเท่านั้นที่รับสมัครได้")
#
#     user = session.get(User, user_id)
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#
#     accepted = json.loads(quest.accepted_members) if quest.accepted_members else []
#     if user_id not in accepted:
#         accepted.append(user_id)
#         quest.accepted_members = json.dumps(accepted)
#
#     if len(accepted) >= quest.team_size:
#         quest.status = "filled"
#
#     user.is_available = False
#
#     session.add(quest)
#     session.add(user)
#     session.commit()
#
#     return {"message": "Applicant accepted", "accepted_count": len(accepted)}


@router.post("/quests/{quest_id}/complete")
def complete_quest(
    quest_id: str,
    user_id_from_token: str = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Mark quest as completed (leader only)."""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.leader_id != user_id_from_token:
        raise HTTPException(status_code=403, detail="เฉพาะหัวหน้าทีมเท่านั้นที่แจ้งจบภารกิจได้")

    if quest.status == "completed":
        raise HTTPException(status_code=400, detail="Quest already completed")

    if quest.status == "cancelled":
        raise HTTPException(status_code=400, detail="Quest was cancelled")

    quest.status = "completed"

    accepted = json.loads(quest.accepted_members) if quest.accepted_members else []
    for uid in accepted:
        user = session.get(User, uid)
        if user:
            user.is_available = True
            session.add(user)

    session.add(quest)
    session.commit()

    return {"message": "Quest completed!", "status": "completed"}


@router.post("/quests/{quest_id}/cancel")
def cancel_quest(
    quest_id: str,
    user_id_from_token: str = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Cancel a quest (leader only)."""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.leader_id != user_id_from_token:
        raise HTTPException(status_code=403, detail="เฉพาะหัวหน้าทีมเท่านั้นที่ยกเลิกภารกิจได้")

    if quest.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel completed quest")

    if quest.status == "cancelled":
        raise HTTPException(status_code=400, detail="Quest already cancelled")

    quest.status = "cancelled"

    accepted = json.loads(quest.accepted_members) if quest.accepted_members else []
    for uid in accepted:
        user = session.get(User, uid)
        if user:
            user.is_available = True
            session.add(user)

    session.add(quest)
    session.commit()

    return {"message": "Quest cancelled", "status": "cancelled"}


@router.post("/quests/{quest_id}/start")
def start_quest(
    quest_id: str,
    user_id_from_token: str = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Start a quest (leader only)."""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.leader_id != user_id_from_token:
        raise HTTPException(status_code=403, detail="เฉพาะหัวหน้าทีมเท่านั้นที่เริ่มภารกิจได้")

    if quest.status not in ["open", "filled"]:
        raise HTTPException(status_code=400, detail="Quest cannot be started")

    quest.status = "in_progress"
    session.add(quest)
    session.commit()

    return {"message": "Quest started!", "status": "in_progress"}
