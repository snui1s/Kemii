from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from database import get_session
from models import User, TeamLog
from schemas import TeamBuilderRequest, ConfirmTeamRequest, TeamRecommendation, ReviveRequest
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dependencies import llm
import json
from datetime import datetime

router = APIRouter()

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

    # 3. เตรียมข้อมูลส่ง AI
    roster_text = ""
    for u in candidates:
        roster_text += f"- ID:{u.id} | {u.name} | Class:{u.character_class} | Stats(O{u.ocean_openness},C{u.ocean_conscientiousness},E{u.ocean_extraversion},A{u.ocean_agreeableness},N{u.ocean_neuroticism})\n"

    # 4. Prompt: Strategy Logic
    strategy_guide = {
        "Balanced": "Mix of all classes to cover weaknesses (Tank, DPS, Support, Brain).",
        "Aggressive": "Focus on High Extraversion (Warrior) & High Neuroticism (Rogue) for speed/impact.",
        "Creative": "Focus on High Openness (Mage) for innovation and solutions.",
        "Supportive": "Focus on High Agreeableness (Cleric) & Conscientiousness (Paladin) for stability."
    }

    prompt = ChatPromptTemplate.from_template("""
    Role: You are the "Grand Guild Master" acting as a Strategic HR Consultant.
    Task: Form a raiding party of {count} heroes from the "Candidates" list to join the "Party Leader".

    **Party Leader:** {leader_name} (Class: {leader_class})
    **Quest Strategy:** {strategy}

    **Strategy Guide (OCEAN x RPG Mode):**
    - **Balanced (สมดุล):** The "Classic Adventure Party". Mix diverse stats: High **C** (Structure), High **E** (Action), and High **A** (Harmony) to handle any situation.
    - **Aggressive (สายลุย):** The "Vanguard Rush". Focus on High **Extraversion (E)** (Warrior energy) to drive execution, close deals, and crush deadlines fast.
    - **Creative (สายไอเดีย):** The "Arcane Council". Focus on High **Openness (O)** (Mage energy) to cast "Brainstorm", innovate solutions, and find new paths.
    - **Supportive (สายซัพ):** The "Iron Fortress". Focus on High **Agreeableness (A)** (Cleric energy) and High **Conscientiousness (C)** (Paladin energy) to ensure stability, support, and zero errors.

    **Candidates (Available Heroes):**
    {roster}

    **CRITICAL OUTPUT RULES:**
    1. **JSON ONLY:** Return strictly valid JSON.
    2. **"reason" Field Format:**
       - Write in **PLAIN THAI TEXT** only.
       - **Blend RPG metaphors with Real Work benefits.**
       - Example: "เลือก [Name] (High O) มาเป็นจอมเวทย์เพื่อเสกไอเดียใหม่ๆ และให้ [Name] (High C) เป็นป้อมปราการคอยตรวจสอบความถูกต้อง ทำให้งานมีความคิดสร้างสรรค์แต่ยังคงเป๊ะตามระบบ"
       - ❌ DO NOT use Markdown (No bold `**`, No italics `*`, No headers `#`).
       - ❌ DO NOT use bullet points (`-` or `•`).
       - Keep it concise (Max 2-3 sentences).

    **JSON OUTPUT:**
    {{
      "selected_ids": [id1, id2, ...],
      "team_name": "Epic Thai Team Name (e.g. ภาคีพิทักษ์เดดไลน์, กองหน้าล่าโปรเจกต์)",
      "reason": "Plain Thai text explaining the synergy without markdown..."
    }}
    """)

    chain = prompt | llm | StrOutputParser()

    try:
        raw = await chain.ainvoke({
            "strategy": req.strategy,
            "guide": strategy_guide.get(req.strategy, "Balanced"),
            "leader_name": leader.name,
            "leader_class": leader.character_class,
            "count": req.member_count,
            "roster": roster_text
        })

        res_json = json.loads(raw.replace("```json", "").replace("```", "").strip())

        # 5. แปลง ID กลับเป็น Object
        selected_members = []
        member_snapshot = [] # สำหรับบันทึกลง Log

        for uid in res_json.get('selected_ids', []):
            u = next((c for c in candidates if c.id == uid), None)
            if u:
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

        # 6. (Optional) บันทึก Draft ลง Log ไว้ก่อน (สถานะ generated)
        # ถ้าอยากให้กด Confirm แล้วค่อย save ก็ข้าม step นี้ หรือ save ไว้ก่อนก็ได้
        new_log = TeamLog(
            leader_id=leader.id,
            team_name=res_json['team_name'],
            strategy=req.strategy,
            reason=res_json['reason'],
            members_snapshot=member_snapshot,
            status="generated"
        )
        session.add(new_log)
        session.commit()
        session.refresh(new_log)

        # 7. ส่งกลับ Frontend
        return {
            "strategy": req.strategy,
            "team_name": res_json['team_name'],
            "reason": res_json['reason'],
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
            "log_id": new_log.id
        }

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail="The Oracle is confused (AI Error).")

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
