import os
import json
from datetime import datetime
from typing import List, Optional, Dict
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session, select
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from database import create_db_and_tables, get_session
from models import User, TeamLog
from schemas import OceanSubmission, UserProfile, MatchRequest,TeamBuilderRequest, ConfirmTeamRequest, TeamRecommendation, ReviveRequest
from auth import create_access_token


load_dotenv()

# --- AI CONFIG ---
if not os.getenv("GOOGLE_API_KEY"):
    print("GOOGLE_API_KEY not found in .env")

# ใช้ Gemini Flash เพื่อความไวและราคาถูก
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
    
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def read_root():
    return {"status": "RPG AI Online", "service": "Hero Analysis"}

@app.post("/submit-assessment", response_model=UserProfile)
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
        name=data.name,
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

@app.get("/users/{user_id}/analysis")
async def get_user_analysis(user_id: int, session: Session = Depends(get_session)):
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
    
    prompt = ChatPromptTemplate.from_template("""
    Role: You are the "Grand Guild Master" who sees through people's souls. 
    You analyze adventurers based on OCEAN stats and translate them into a Fantasy RPG profile that feels deeply personal and relatable to their work life.
    
    Tone: Epic, Insightful, Empathetic, and "Spot-on" (**STRICTLY THAI LANGUAGE ONLY**).
    
    Hero: {name} | Class: {rpg_class}
    Stats: Openness={openness}, Conscientiousness={conscientiousness}, Extraversion={extraversion}, Agreeableness={agreeableness}, Neuroticism={neuroticism}
    
    **TASK:** Write a profile that makes the user say "This is literally me!". 
    
    **CRITICAL INSTRUCTION: DYNAMIC STAT ANALYSIS**
    Do not just look at single stats. You MUST analyze the **INTERACTION** between the 2-3 most distinct stats (Highest or Lowest).
    
    - **START DIRECTLY:** Do NOT use prefixes like "คำทำนาย:", "The Prophecy:", "การกำเนิด:", or "บทวิเคราะห์:". 
    - Start with "{name} เปรียบเสมือน..." or "ภายในใจของเจ้าคือ..." immediately.

    **Apply these 3 Logic Rules:**
    1.  **The Conflict (High X vs Low Y):** If they have high ambition (e.g., High Openness) but low discipline (Low Conscientiousness), describe this as their "Inner Struggle" or "Curse".
    2.  **The Synergy (High X + High Y):** If they have two high positive stats (e.g., High Extraversion + High Agreeableness), describe this as their "Ultimate Combo" but warn about doing too much (e.g., People pleaser).
    3.  **The Lone Wolf (Extreme High/Low):** If one stat stands out extremely (e.g., Very High Neuroticism), focus on how this is both their radar (sensitivity) and their poison (anxiety).

    **Reference Archetypes (Examples only - Apply logic to ANY combo):**
    - High O + Low C: "The Chaotic Genius" (Ideas > Execution).
    - High O + High C: "The Grand Architect" (Vision + Structure).
    - High A + High N: "The Empathic Healer" (Absorbs stress easily).
    - High E + High N: "The Storm Caller" (High energy, high emotion, reactive).
    - Low E + High C: "The Silent Sniper" (Quiet, precise, deadly efficient).
    - Low A + High E: "The Commander" (Direct, result-oriented, thick-skinned).
    
    **OUTPUT RULES (Deep & Relatable):**
    1. **class_title**: Creative Thai Class Name (e.g. "จอมเวทย์จอมปั่น", "อัศวินไร้เงา").
    2. **prophecy**: Write 3-4 sentences in Thai.
       - **NO TITLE OR SUMMARY PHRASE:** Do NOT start with a short phrase like "ผู้สร้างสรรค์:", "พลังแห่งความมืด", or anything similar.
       - **START WITH SUBJECT DIRECTLY:** The first word MUST be "{name}", "เจ้า", or "คุณ".
       - **BAD:** "นักรบผู้บ้าคลั่ง เจ้าคือผู้ที่..." (Do not do this).
       - **GOOD:** "{name} เปรียบเสมือนนักรบผู้บ้าคลั่งที่..." (Do this).
       - Describe their "Inner World" vs "Outer World" immediately.
    3. **strengths**: 3 bullet points. **(Length: 2 sentences each)**.
       - Structure: [RPG Metaphor] -> [Real Work Scenario].
    4. **weaknesses**: 2 bullet points. **(Length: 2 sentences each)**.
       - Focus on the **"Side Effect"** of their specific stat mix.
    5. **best_partner**: "[Class Name] - [Reason]"
    
    **NEGATIVE CONSTRAINTS (STRICT):**
    - **ABSOLUTELY NO ENGLISH TEXT.**
    - **NO MARKDOWN:** No bold (**), no italics (*), no headers (##).
    - **NO LABELS/PREFIXES:** Do not put "Strength 1:", "Weakness:", or bullets symbols inside the text string. Just the content.
    - **PLAIN TEXT ONLY:** No HTML tags.
    - **Concise:** Keep sentences clear and direct.
    
    **JSON FORMAT ONLY:**
    {{
      "class_title": "...",
      "prophecy": "...",
      "strengths": ["...", "...", "..."],
      "weaknesses": ["...", "..."],
      "best_partner": "..."
    }}
    """)
    
    chain = prompt | llm | StrOutputParser()
    
    try:
        raw_res = await chain.ainvoke({
            "name": user.name,
            "rpg_class": user.character_class,
            "openness": user.ocean_openness,
            "conscientiousness": user.ocean_conscientiousness,
            "extraversion": user.ocean_extraversion,
            "agreeableness": user.ocean_agreeableness,
            "neuroticism": user.ocean_neuroticism
        })
        
        # Clean & Parse JSON
        clean_json = raw_res.replace("```json", "").replace("```", "").strip()
        ai_data = json.loads(clean_json)
        
        # Save to DB
        user.analysis_result = json.dumps(ai_data, ensure_ascii=False)
        session.add(user)
        session.commit()
        
    except Exception as e:
        print(f"AI Error: {e}")
        ai_data = {
            "class_title": f"{user.character_class} ฝึกหัด",
            "prophecy": "พลังของท่านยังคลุมเครือ... โปรดลองใหม่อีกครั้ง",
            "strengths": ["Unknown"],
            "weaknesses": ["Unknown"],
            "best_partner": "Unknown"
        }

    return {
        "user": user_data,
        "analysis": ai_data
    }

@app.get("/users", response_model=List[UserProfile])
def get_users(session: Session = Depends(get_session)):
    # ดึงข้อมูลทั้งหมด เรียงตาม ID ล่าสุด
    users = session.exec(select(User).order_by(User.id.desc())).all()
    
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "name": u.name,
            "character_class": u.character_class,
            "level": u.level,
            "ocean_scores": {
                "Openness": u.ocean_openness or 0,
                "Conscientiousness": u.ocean_conscientiousness or 0,
                "Extraversion": u.ocean_extraversion or 0,
                "Agreeableness": u.ocean_agreeableness or 0,
                "Neuroticism": u.ocean_neuroticism or 0
            }
        })
    return results


@app.post("/match-ai")
# @limiter.limit("10/minute") # Uncomment ถ้าจะใช้ Rate Limit
async def match_users_ai(request: Request, req: MatchRequest, session: Session = Depends(get_session)):
    u1 = session.get(User, req.user1_id)
    u2 = session.get(User, req.user2_id)
    
    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="Heroes not found")
        
    def get_stats(u):
        return {
            "O": u.ocean_openness or 0,
            "C": u.ocean_conscientiousness or 0,
            "E": u.ocean_extraversion or 0,
            "A": u.ocean_agreeableness or 0,
            "N": u.ocean_neuroticism or 0
        }
        
    s1 = get_stats(u1)
    s2 = get_stats(u2)
    
    # Base Score เริ่มต้น 60%
    score = 60
    
    # Logic: Agreeableness (FTH) คือกาวใจ
    avg_A = (s1["A"] + s2["A"]) / 2
    score += (avg_A / 20) * 15  # สูงสุด +15%
    
    # Logic: Neuroticism (DEX/Sensitivity) สูงทั้งคู่คือระเบิดเวลา
    avg_N = (s1["N"] + s2["N"]) / 2
    if avg_N > 15: score -= 10
    
    # Logic: Extraversion (STR) ต่างกันเติมเต็มกัน (คนนึงพูด คนนึงฟัง)
    diff_E = abs(s1["E"] - s2["E"])
    if diff_E > 10: score += 10 # ต่างกันเยอะ = ดี (Balance)
    
    # Logic: Conscientiousness (VIT) ใกล้กันทำงานง่าย
    diff_C = abs(s1["C"] - s2["C"])
    if diff_C < 5: score += 10 # ใกล้กัน = ดี
    
    # Cap Score 0-100
    final_score = max(10, min(99, int(score)))
    
    print(f"⚔️ Soul Link: {u1.name} ({u1.character_class}) x {u2.name} ({u2.character_class}) = {final_score}%")

    # --- 2. เรียก AI ให้วิเคราะห์ (Roleplay) ---
   # Prompt จับคู่ (ฉบับความยาวกำลังดี มีเนื้อหา RPG)
    match_prompt = ChatPromptTemplate.from_template("""
   Role: You are a "Guild Strategy Consultant" expert in HR Dynamics and RPG Parties.
    Tone: Epic Fantasy RPG mixed with Professional Work Insight (Thai Language).
    
    **Hero 1:** {name1} (Class: {class1})
    - Stats: O={o1}, C={c1}, E={e1}, A={a1}, N={n1}
    
    **Hero 2:** {name2} (Class: {class2})
    - Stats: O={o2}, C={c2}, E={e2}, A={a2}, N={n2}
    
    **Calculated Synergy:** {score}%
    
    # 🧠 WORK-STYLE MAPPING (Interpret classes this way):
    - **Mage (High Openness):** The "Visionary". Creates ideas, strategy, and innovation.
    - **Paladin (High Conscientiousness):** The "Anchor". Manages structure, discipline, and handles pressure.
    - **Warrior (High Extraversion):** The "Driver". Pushes execution, sales, and communication.
    - **Cleric (High Agreeableness):** The "Healer". Maintains team harmony and supports others.
    - **Rogue (Neuroticism/Detail):** The "Auditor". Spots errors, risks, and details that others miss.

    **TASK:**
    Analyze the chemistry between these two. Explain how their working styles (Classes) support or clash with each other in a professional guild setting.

    **OUTPUT JSON RULES:**
    1. **synergy_name**: Creative Thai Combo Name (e.g., "คู่หูวิสัยทัศน์เหล็ก", "ดาบและโล่พิทักษ์งาน").
    2. **analysis**: Write 2-3 sentences in Thai.
       - Blend RPG metaphors with Work benefits.
       - Example: "คนหนึ่งเปรียบเสมือน Mage ที่คอยร่ายเวทย์ไอเดียใหม่ๆ ส่วนอีกคนคือ Paladin ที่คอยกางโล่ป้องกันความเสี่ยงและคุมเดดไลน์ให้ ทำให้งานทั้งสร้างสรรค์และมั่นคง"
    3. **pro_tip**: One actionable advice for working together effectively (1-2 sentences).
    
    **JSON FORMAT ONLY (No Markdown):**
    {{
      "synergy_score": {score},
      "synergy_name": "...",
      "analysis": "...",
      "pro_tip": "..."
    }}
    """)
    
    chain = match_prompt | llm | StrOutputParser()
    
    try:
        raw_result = await chain.ainvoke({
            "name1": u1.name, "class1": u1.character_class, 
            "o1": s1["O"], "c1": s1["C"], "e1": s1["E"], "a1": s1["A"], "n1": s1["N"],
            "name2": u2.name, "class2": u2.character_class,
            "o2": s2["O"], "c2": s2["C"], "e2": s2["E"], "a2": s2["A"], "n2": s2["N"],
            "score": final_score
        })
        
        cleaned_json = raw_result.replace("```json", "").replace("```", "").strip()
        analysis_json = json.loads(cleaned_json)
        
    except Exception as e:
        print(f"AI Error: {e}")
        analysis_json = {
            "synergy_score": final_score,
            "synergy_name": "พันธสัญญาแห่งโชคชะตา",
            "analysis": "พลังเวทย์ผันผวน... ไม่สามารถอ่านคำทำนายได้ชัดเจน แต่ค่าพลังพื้นฐานบ่งบอกถึงความเป็นไปได้",
            "pro_tip": "ลองให้ทั้งคู่ลงดันเจี้ยนง่ายๆ ร่วมกันดูก่อน",
        }
    
    # ส่งข้อมูลกลับ (Frontend จะเอาไปโชว์ใน Modal)
    return {
        "user1": u1,
        "user2": u2,
        "ai_analysis": analysis_json
    }

@app.get("/users/roster")
def get_user_roster(session: Session = Depends(get_session)):
    # 1. เช็คปลดล็อคคน
    check_and_release_users(session)
    
    # 2. ดึงข้อมูล
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

@app.post("/recommend-team-members", response_model=TeamRecommendation)
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
    
@app.post("/confirm-team")
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

@app.post("/reset-teams")
def reset_teams(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    for user in users:
        user.is_available = True
        user.active_project_end_date = None
        user.guild_name = None
        session.add(user)
    
    session.commit()
    return {"message": "All heroes recalled to the tavern!"}

@app.get("/team-logs")
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

@app.post("/team-logs/{log_id}/disband")
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

@app.post("/team-logs/{log_id}/revive")
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

@app.delete("/team-logs/{log_id}")
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

@app.delete("/team-logs")
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)