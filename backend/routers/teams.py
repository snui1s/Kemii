from fastapi import APIRouter, HTTPException, Depends, Request
from sqlmodel import Session, select
from database import get_session
from models import User, TeamLog
from schemas import (
    MatchRequest, TeamBuilderRequest, ConfirmTeamRequest, TeamRecommendation, ReviveRequest
)
from services.matching import get_stats, calculate_academic_cost, calculate_team_score, get_team_rating, LAMBDA, TAU
from services.ai import analyze_match_synergy, generate_team_name
from datetime import datetime
import json

router = APIRouter()

@router.post("/match-ai")
# @limiter.limit("10/minute") # Uncomment ถ้าจะใช้ Rate Limit
async def match_users_ai(request: Request, req: MatchRequest, session: Session = Depends(get_session)):
    u1 = session.get(User, req.user1_id)
    u2 = session.get(User, req.user2_id)

    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="Heroes not found")

    # === NEW FORMULA ===
    # Use global helper
    s1 = get_stats(u1)
    s2 = get_stats(u2)
    stats = [s1, s2]
    cost = calculate_academic_cost(stats)

    # Score = 100 × (1 - (Cost / (6 + λ×τ)))
    denominator = 6 + LAMBDA * TAU  # = 7.25
    score = 100 * (1 - (cost / denominator))
    final_score = max(0, min(100, int(round(score))))  # Clamp to 0-100

    team_rating = get_team_rating(final_score)

    # Debug log
    print(f"📊 DEBUG: cost={cost:.4f}, score={score:.2f}")
    print(f"⚔️ Soul Link: {u1.name} ({u1.character_class}) x {u2.name} ({u2.character_class}) = {final_score}% [{team_rating}]")

    # --- 2. เรียก AI ให้วิเคราะห์ (Roleplay) ---
    analysis_json = await analyze_match_synergy(u1, u2, s1, s2, final_score)

    # ส่งข้อมูลกลับ (Frontend จะเอาไปโชว์ใน Modal)
    return {
        "user1": u1,
        "user2": u2,
        "ai_analysis": analysis_json,
        "team_rating": team_rating
    }

@router.post("/recommend-team-members", response_model=TeamRecommendation)
async def recommend_team_members(req: TeamBuilderRequest, session: Session = Depends(get_session)):
    # 1. ดึงหัวหน้า
    leader = session.get(User, req.leader_id)
    if not leader:
        raise HTTPException(status_code=404, detail="Leader not found")

    # 2. ดึง Candidates (คนว่างงาน และไม่ใช่หัวหน้า)
    candidates = session.exec(
        select(User).where(User.is_available == True, User.id != req.leader_id)
    ).all()

    if len(candidates) < req.member_count:
        raise HTTPException(status_code=400, detail=f"Not enough heroes available! Need {req.member_count}, found {len(candidates)}")

    # Start with leader
    selected_team = [leader]
    selected_stats = [get_stats(leader)]
    remaining_candidates = list(candidates)

    print(f"🎯 Headhunter: Starting with Leader [{leader.name}]")

    # Greedy selection: pick best candidate each round
    for round_num in range(req.member_count):
        best_candidate = None
        best_cost = float('inf')

        for candidate in remaining_candidates:
            # Try adding this candidate to the team
            test_stats = selected_stats + [get_stats(candidate)]
            real_cost = calculate_academic_cost(test_stats)

            # Apply Strategy Bias (Heuristic)
            heuristic_cost = real_cost

            # Helper to get mean of a trait
            def get_mean(trait, stats_list):
                 return sum(s[trait] for s in stats_list) / len(stats_list)

            BIAS_WEIGHT = 0.5  # Adjust weight as needed

            if req.strategy == "Aggressive":
                # Favor High Extraversion
                heuristic_cost -= (get_mean("E", test_stats) / 10.0) * BIAS_WEIGHT
            elif req.strategy == "Creative":
                # Favor High Openness
                heuristic_cost -= (get_mean("O", test_stats) / 10.0) * BIAS_WEIGHT
            elif req.strategy == "Supportive":
                # Favor High Agreeableness + Conscientiousness
                score = (get_mean("A", test_stats) + get_mean("C", test_stats)) / 2
                heuristic_cost -= (score / 10.0) * BIAS_WEIGHT

            # Balanced uses purely real_cost (no bias)

            if heuristic_cost < best_cost:
                best_cost = heuristic_cost
                best_candidate = candidate

        if best_candidate:
            selected_team.append(best_candidate)
            selected_stats.append(get_stats(best_candidate))
            remaining_candidates.remove(best_candidate)

            current_score = calculate_team_score(best_cost)
            print(f"   Round {round_num + 1}: Added [{best_candidate.name}] -> Cost={best_cost:.4f}, Score={current_score}%")

    # Calculate final team score
    final_cost = calculate_academic_cost(selected_stats)
    final_score = calculate_team_score(final_cost)
    team_rating = get_team_rating(final_score)

    print(f"✅ Headhunter Complete: Final Score={final_score}% [{team_rating}]")

    # Get selected members (excluding leader)
    selected_members_users = selected_team[1:]  # Exclude leader

    # 3. ใช้ AI สร้างชื่อทีมและเหตุผล
    member_names = ", ".join([u.name for u in selected_members_users])
    team_name, reason = await generate_team_name(leader, member_names, final_score, team_rating, req.strategy)

    # 4. สร้าง Response
    selected_members = []
    member_snapshot = []

    for u in selected_members_users:
        u_dict = {
            "id": u.id, "name": u.name, "character_class": u.character_class, "dominant_type": f"Lv.{u.level}",
            "scores": {
                "Openness": u.ocean_openness or 0,
                "Conscientiousness": u.ocean_conscientiousness or 0,
                "Extraversion": u.ocean_extraversion or 0,
                "Agreeableness": u.ocean_agreeableness or 0,
                "Neuroticism": u.ocean_neuroticism or 0
            }
        }
        selected_members.append(u_dict)
        member_snapshot.append({
            "id": u.id,
            "name": u.name,
            "character_class": u.character_class,
            "dominant_type": f"Lv.{u.level}",
            "scores": u_dict["scores"]
        })

    # 5. บันทึก Log
    new_log = TeamLog(
        leader_id=leader.id,
        team_name=team_name,
        strategy=req.strategy,
        reason=reason,
        members_snapshot=member_snapshot,
        status="generated"
    )
    session.add(new_log)
    session.commit()
    session.refresh(new_log)

    print("team_score", final_score)
    print("team_rating", team_rating)

    # 6. ส่งกลับ Frontend
    return {
        "strategy": req.strategy,
        "team_name": team_name,
        "reason": reason,
        "leader": {
            "id": leader.id, "name": leader.name, "character_class": leader.character_class, "dominant_type": f"Lv.{leader.level}",
            "scores": {
                "Openness": leader.ocean_openness or 0,
                "Conscientiousness": leader.ocean_conscientiousness or 0,
                "Extraversion": leader.ocean_extraversion or 0,
                "Agreeableness": leader.ocean_agreeableness or 0,
                "Neuroticism": leader.ocean_neuroticism or 0
            }
        },
        "members": selected_members,
        "log_id": new_log.id,
        "team_score": final_score,
        "team_rating": team_rating
    }

@router.post("/confirm-team")
def confirm_team(req: ConfirmTeamRequest, session: Session = Depends(get_session)):

    # กรณี 1: มี Log ID (จาก AI Recommend)
    if req.log_id:
        log = session.get(TeamLog, req.log_id)
        if not log: raise HTTPException(404, "Log not found")

        log.status = "confirmed"
        log.project_start_date = req.start_date
        log.project_end_date = req.end_date
        session.add(log)

        # ล็อคหัวหน้า
        leader = session.get(User, log.leader_id)
        if leader:
            leader.is_available = False
            leader.active_project_end_date = req.end_date
            leader.team_name = log.team_name # (Optional)
            session.add(leader)

        # ล็อคลูกน้อง (จาก Snapshot)
        for m in log.members_snapshot:
            mem = session.get(User, m['id'])
            if mem:
                mem.is_available = False
                mem.active_project_end_date = req.end_date
                mem.team_name = log.team_name
                session.add(mem)

    # กรณี 2: ส่ง ID มาเอง (Custom Manual Build) - เผื่ออนาคต
    elif req.member_ids:
        # (Logic คล้ายกัน คือ Loop update user status)
        pass

    session.commit()
    return {"message": "Party formed! Heroes are now on a quest."}

@router.post("/reset-teams")
def reset_teams(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    for user in users:
        user.is_available = True
        user.active_project_end_date = None
        user.guild_name = None
        session.add(user)

    session.commit()
    return {"message": "All heroes recalled to the tavern!"}

@router.get("/team-logs")
def get_team_logs(session: Session = Depends(get_session)):
    logs = session.exec(select(TeamLog).order_by(TeamLog.created_at.desc())).all()
    results = []
    for log in logs:
        leader = session.get(User, log.leader_id)

        # Map Snapshot for Frontend
        mapped_members = []
        for m in log.members_snapshot:
            character_class = m.get("character_class") or m.get("class") or "Novice"
            mapped_members.append({
                **m,
                "character_class": character_class,
                "dominant_type": m.get("dominant_type", "Lv.1"),
                "scores": m.get("scores", {})
            })

        results.append({
            "id": log.id,
            "team_name": log.team_name,
            "strategy": log.strategy,
            "reason": log.reason,
            "created_at": log.created_at,
            "project_start_date": log.project_start_date,
            "project_end_date": log.project_end_date,
            "status": log.status,
            "leader_id": log.leader_id,
            "leader_name": leader.name if leader else "Unknown Hero",
            "leader_class": leader.character_class if leader else "Novice",
            "members_snapshot": mapped_members
        })
    return results

@router.post("/team-logs/{log_id}/disband")
def disband_team(log_id: int, session: Session = Depends(get_session)):
    log = session.get(TeamLog, log_id)
    if not log:
        raise HTTPException(404, "Mission log not found")

    if log.status != "confirmed":
        raise HTTPException(400, "Only active teams can be disbanded")

    # 1. เปลี่ยนสถานะ Log
    log.status = "disbanded"
    log.project_end_date = datetime.now() # จบภารกิจทันที
    session.add(log)

    # 2. ปลดล็อค Leader
    leader = session.get(User, log.leader_id)
    if leader:
        leader.is_available = True
        leader.active_project_end_date = None
        leader.team_name = None
        session.add(leader)

    # 3. ปลดล็อค Members
    for m in log.members_snapshot:
        user = session.get(User, m['id'])
        if user:
            user.is_available = True
            user.active_project_end_date = None
            user.team_name = None
            session.add(user)

    session.commit()
    return {"message": "Team disbanded. Heroes returned to the tavern."}

@router.post("/team-logs/{log_id}/revive")
def revive_team(log_id: int, req: ReviveRequest, session: Session = Depends(get_session)):
    log = session.get(TeamLog, log_id)
    if not log:
        raise HTTPException(404, "Log not found")

    # 1. เช็คก่อนว่าสมาชิกทุกคนว่างไหม?
    all_ids = [log.leader_id] + [m['id'] for m in log.members_snapshot]
    busy_heroes = []

    for uid in all_ids:
        user = session.get(User, uid)
        if not user: continue
        if not user.is_available:
            busy_heroes.append(user.name)

    if busy_heroes:
        raise HTTPException(409, detail=f"Cannot revive! Heroes are busy: {', '.join(busy_heroes)}")

    # 2. ถ้าว่างทุกคน -> ล็อคตัวใหม่
    log.status = "confirmed"
    log.project_start_date = req.start_date
    log.project_end_date = req.end_date
    log.created_at = datetime.now() # อัปเดตเวลาล่าสุดให้เด้งไปบนสุด
    session.add(log)

    for uid in all_ids:
        user = session.get(User, uid)
        if user:
            user.is_available = False
            user.team_name = log.team_name
            user.active_project_end_date = req.end_date
            session.add(user)

    session.commit()
    return {"message": "Team revived! The legend continues."}

@router.delete("/team-logs/{log_id}")
def delete_team_log(log_id: int, session: Session = Depends(get_session)):
    log = session.get(TeamLog, log_id)
    if not log:
        raise HTTPException(404, "Log not found")

    leader = session.get(User, log.leader_id)
    if leader and leader.team_name == log.team_name:
        leader.team_name = None
        leader.is_available = True
        leader.active_project_end_date = None
        session.add(leader)

    for m in log.members_snapshot:
        member = session.get(User, m['id'])
        if member and member.team_name == log.team_name:
            member.team_name = None
            member.is_available = True
            member.active_project_end_date = None
            session.add(member)

    session.delete(log)
    session.commit()
    return {"message": "Log burned from the archives."}

@router.delete("/team-logs")
def clear_all_logs(session: Session = Depends(get_session)):
    logs = session.exec(select(TeamLog)).all()
    users = session.exec(select(User)).all()
    for log in logs:
        session.delete(log)
    for user in users:
        user.team_name = None
        user.is_available = True
        user.active_project_end_date = None
        session.add(user)
    session.commit()
    return {"message": "All history cleared"}
