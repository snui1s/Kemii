from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from database import get_session
from models import Quest, User
from schemas import CreateQuestRequest, UpdateStatusRequest
from services.ai import generate_quest
from services.matching import calculate_match_score, find_best_candidates, get_stats, calculate_academic_cost, evaluate_team
from datetime import datetime
from skills_data import DEPARTMENTS
import json

router = APIRouter()

@router.get("/quests")
def get_quests(status: str = None, session: Session = Depends(get_session)):
    """Get all quests, optionally filtered by status"""
    if status:
        quests = session.exec(select(Quest).where(Quest.status == status)).all()
    else:
        # Show all quests (Frontend handles filtering active/history)
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
            "harmony_score": 0
        }

        # Calculate Harmony Score (Lightweight)
        accepted_ids = json.loads(q.accepted_members) if q.accepted_members else []
        if accepted_ids and leader:
            team_users = [leader]
            for uid in accepted_ids:
                 u = session.get(User, uid)
                 if u: team_users.append(u)

            if len(team_users) >= 2:
                # Use centralized Golden Formula
                eval_result = evaluate_team(team_users)
                quest_dict["harmony_score"] = int(round(eval_result["score"]))

        result.append(quest_dict)

    return {"quests": result}





@router.get("/quests/{quest_id}")
def get_quest_detail(quest_id: int, session: Session = Depends(get_session)):
    """Get quest details including applicants"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    leader = session.get(User, quest.leader_id)
    accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []



    # Get accepted members details
    accepted_members = []
    req_skills = json.loads(quest.required_skills)
    req_skills = json.loads(quest.required_skills)

    for uid in accepted_ids:
        user = session.get(User, uid)
        if user:
            user_skills = json.loads(user.skills) if user.skills else []
            user_skill_map = {s['name']: s['level'] for s in user_skills}

            matching = []
            # Check against required skills
            for req in req_skills:
                if req['name'] in user_skill_map:
                    matching.append({
                        "name": req['name'],
                        "level": user_skill_map[req['name']],
                        "type": "required"
                    })



            # Sort by level desc
            matching.sort(key=lambda x: x['level'], reverse=True)

            # Extract Department from skills
            department = "Unknown"
            dept_names = [d["name"] for d in DEPARTMENTS]
            for s in user_skills:
                # Check if this skill is a Department name
                if s["name"] in dept_names:
                    department = s["name"]
                    break
        
            accepted_members.append({
                "id": user.id,
                "name": user.name,
                "character_class": user.character_class,
                "department": department,
                "level": user.level,
                "matching_skills": matching
            })

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
        "created_at": quest.created_at.isoformat()
    }


@router.patch("/quests/{quest_id}/team-size")
def update_quest_team_size(quest_id: int, team_size: int, session: Session = Depends(get_session)):
    """Update quest team size (leader only)"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.status not in ["open", "filled"]:
        raise HTTPException(status_code=400, detail="Cannot change team size for started/completed quests")

    # Validate team_size
    accepted_count = len(json.loads(quest.accepted_members)) if quest.accepted_members else 0
    if team_size < accepted_count:
        raise HTTPException(status_code=400, detail=f"Cannot reduce below {accepted_count} accepted members")

    if team_size < 1 or team_size > 10:
        raise HTTPException(status_code=400, detail="Team size must be between 1 and 10")

    quest.team_size = team_size

    # Update status based on new team size
    if accepted_count >= team_size:
        quest.status = "filled"
    else:
        quest.status = "open"

    session.add(quest)
    session.commit()
    session.refresh(quest)

    return {
        "message": f"Team size updated to {team_size}",
        "team_size": quest.team_size,
        "status": quest.status
    }


@router.get("/quests/{quest_id}/team-analysis")
def get_team_analysis(quest_id: int, session: Session = Depends(get_session)):
    """Analyze team compatibility and skill coverage"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []
    if not accepted_ids:
        return {"has_team": False}

    # Get required skills
    required_skills = json.loads(quest.required_skills) if isinstance(quest.required_skills, str) else quest.required_skills

    # Build team skill inventory
    team_skills = {}
    team_ocean = {"O": [], "C": [], "E": [], "A": [], "N": []}

    for uid in accepted_ids:
        user = session.get(User, uid)
        if user:
            user_skills = json.loads(user.skills) if user.skills else []
            for s in user_skills:
                skill_name = s.get("name", "")
                skill_level = s.get("level", 0)
                if skill_name not in team_skills or skill_level > team_skills[skill_name]:
                    team_skills[skill_name] = skill_level

            # Collect OCEAN scores
            team_ocean["O"].append(user.ocean_openness or 25)
            team_ocean["C"].append(user.ocean_conscientiousness or 25)
            team_ocean["E"].append(user.ocean_extraversion or 25)
            team_ocean["A"].append(user.ocean_agreeableness or 25)
            team_ocean["N"].append(user.ocean_neuroticism or 25)

    # Calculate skill coverage
    covered_skills = []
    missing_skills = []
    partial_skills = []

    for req in required_skills:
        skill_name = req["name"]
        required_level = req["level"]
        team_level = team_skills.get(skill_name, 0)

        if team_level >= required_level:
            covered_skills.append({"name": skill_name, "required": required_level, "has": team_level})
        elif team_level > 0:
            partial_skills.append({"name": skill_name, "required": required_level, "has": team_level})
        else:
            missing_skills.append({"name": skill_name, "required": required_level})

    total_skills = len(required_skills)
    coverage_percent = int((len(covered_skills) / max(total_skills, 1)) * 100)

    # Calculate OCEAN compatibility (Golden Formula)
    team_users = []
    
    # Add Leader first
    leader = session.get(User, quest.leader_id)
    if leader:
        team_users.append(leader)

    # Add Members
    for uid in accepted_ids:
        u = session.get(User, uid)
        if u: team_users.append(u)
    
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
            "all_covered": len(missing_skills) == 0 and len(partial_skills) == 0
        },
        "harmony_score": harmony_score,
        "team_ocean": {
            "O": int(sum(team_ocean["O"]) / len(team_ocean["O"])) if team_ocean["O"] else 0,
            "C": int(sum(team_ocean["C"]) / len(team_ocean["C"])) if team_ocean["C"] else 0,
            "E": int(sum(team_ocean["E"]) / len(team_ocean["E"])) if team_ocean["E"] else 0,
            "A": int(sum(team_ocean["A"]) / len(team_ocean["A"])) if team_ocean["A"] else 0,
            "N": int(sum(team_ocean["N"]) / len(team_ocean["N"])) if team_ocean["N"] else 0
        }
    }

@router.get("/quests/{quest_id}/match/{user_id}")
def get_quest_match_score(quest_id: int, user_id: int, session: Session = Depends(get_session)):
    """Calculate how well a user matches a quest"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user's skills
    user_skills = json.loads(user.skills) if user.skills else []

    # Get user's OCEAN scores
    user_ocean = {
        "ocean_openness": user.ocean_openness,
        "ocean_conscientiousness": user.ocean_conscientiousness,
        "ocean_extraversion": user.ocean_extraversion,
        "ocean_agreeableness": user.ocean_agreeableness,
        "ocean_neuroticism": user.ocean_neuroticism
    }

    # Calculate match score
    match_result = calculate_match_score(user_skills, user_ocean, quest)

    return match_result


@router.get("/quests/{quest_id}/candidates")
def get_quest_candidates(quest_id: int, session: Session = Depends(get_session)):
    """AI finds best matching candidates for a quest using Dynamic Gap Scoring"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Get all users
    all_users = session.exec(select(User)).all()

    # Exclude the quest leader
    available_users = [u for u in all_users if u.id != quest.leader_id]

    # Get current team members (to calculate skill gaps)
    accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []
    current_members = [session.get(User, uid) for uid in accepted_ids if session.get(User, uid)]

    # Find best candidates using Dynamic Gap Scoring
    candidates = find_best_candidates(quest, available_users, quest.team_size * 2, current_members)

    return {"candidates": candidates}


@router.post("/quests/{quest_id}/kick/{user_id}")
def kick_member(quest_id: int, user_id: int, session: Session = Depends(get_session)):
    """Remove a member from the quest team (leader only)"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.status not in ["open", "filled"]:
        raise HTTPException(status_code=400, detail="Cannot kick members from started/completed quests")

    accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []

    if user_id not in accepted_ids:
        raise HTTPException(status_code=400, detail="User is not a team member")

    # Remove user from accepted_members
    accepted_ids.remove(user_id)
    quest.accepted_members = json.dumps(accepted_ids)

    # Make user available again
    user = session.get(User, user_id)
    if user:
        user.is_available = True
        user.active_project_end_date = None
        session.add(user)

    # Update quest status
    if len(accepted_ids) < quest.team_size:
        quest.status = "open"

    session.add(quest)
    session.commit()

    return {"message": f"ปลดสมาชิกแล้ว", "remaining_members": len(accepted_ids)}


@router.post("/quests/{quest_id}/auto-assign")
def auto_assign_team(quest_id: int, session: Session = Depends(get_session)):
    """AI automatically assigns best matching candidates to the quest team"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.status not in ["open", "filled"]:
        raise HTTPException(status_code=400, detail="Quest is not open for team assignment")

    # Get all users
    all_users = session.exec(select(User)).all()

    # Exclude the quest leader and already accepted members
    accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []
    available_users = [u for u in all_users if u.id != quest.leader_id and u.id not in accepted_ids]

    # Calculate how many more members we need
    current_count = len(accepted_ids)
    needed = quest.team_size - current_count

    if needed <= 0:
        return {"message": "ทีมครบแล้ว", "assigned": [], "total_members": current_count}

    # Find best candidates
    candidates = find_best_candidates(quest, available_users, needed)

    # Auto-assign top candidates
    assigned = []
    for candidate in candidates:
        user = session.get(User, candidate["user_id"])
        if user and user.is_available:
            # Add to accepted members
            accepted_ids.append(user.id)
            # Mark user as unavailable
            user.is_available = False
            session.add(user)
            assigned.append({
                "user_id": user.id,
                "name": user.name,
                "character_class": user.character_class,
                "level": user.level,
                "match_score": candidate["match_score"],
                "skill_score": candidate["skill_score"],
                "ocean_score": candidate["ocean_score"],
                "matching_skills": candidate["matching_skills"]
            })

    # Update quest
    quest.accepted_members = json.dumps(accepted_ids)
    if len(accepted_ids) >= quest.team_size:
        quest.status = "filled"

    session.add(quest)
    session.commit()

    return {
        "message": f"จัดทีมสำเร็จ! เพิ่ม {len(assigned)} คน",
        "assigned": assigned,
        "total_members": len(accepted_ids)
    }





@router.post("/quests/{quest_id}/status")
def update_quest_status(quest_id: int, req: UpdateStatusRequest, session: Session = Depends(get_session)):
    """Update quest status (e.g. start, complete, fail)"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.leader_id != req.user_id:
        raise HTTPException(status_code=403, detail="Only leader can update status")

    # Validate transition
    if req.status not in ["open", "filled", "in_progress", "completed", "failed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    quest.status = req.status

    # Handle side effects
    if req.status in ["completed", "failed"]:
        # Free up members when quest ends
        accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []
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


@router.post("/quests/{quest_id}/accept/{user_id}")
def accept_applicant(quest_id: int, user_id: int, session: Session = Depends(get_session)):
    """Leader accepts an applicant"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add to accepted members
    accepted = json.loads(quest.accepted_members) if quest.accepted_members else []
    if user_id not in accepted:
        accepted.append(user_id)
        quest.accepted_members = json.dumps(accepted)

    # Check if team is full
    if len(accepted) >= quest.team_size:
        quest.status = "filled"

    # Update user availability
    user.is_available = False

    session.add(quest)
    session.add(user)
    session.commit()

    return {"message": "Applicant accepted", "accepted_count": len(accepted)}


@router.post("/quests/{quest_id}/complete")
def complete_quest(quest_id: int, session: Session = Depends(get_session)):
    """Mark quest as completed - releases members' availability"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.status == "completed":
        raise HTTPException(status_code=400, detail="Quest already completed")

    if quest.status == "cancelled":
        raise HTTPException(status_code=400, detail="Quest was cancelled")

    # Update quest status
    quest.status = "completed"

    # Release accepted members
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
def cancel_quest(quest_id: int, session: Session = Depends(get_session)):
    """Cancel a quest - releases all applicants and members"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel completed quest")

    if quest.status == "cancelled":
        raise HTTPException(status_code=400, detail="Quest already cancelled")

    # Update quest status
    quest.status = "cancelled"

    # Release accepted members
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
def start_quest(quest_id: int, session: Session = Depends(get_session)):
    """Start working on a quest - changes status to in_progress"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.status not in ["open", "filled"]:
        raise HTTPException(status_code=400, detail="Quest cannot be started")

    quest.status = "in_progress"
    session.add(quest)
    session.commit()

    return {"message": "Quest started!", "status": "in_progress"}
