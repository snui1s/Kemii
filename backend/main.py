from datetime import datetime
import os
import json
import math

from typing import List, Dict, Optional, Any 
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session, select

from database import create_db_and_tables, get_session
from models import User, TeamLog
from schemas import (
    Answer,UserSubmission, UserResult, MatchRequest, GroupingRequest, 
    UserNameUpdate, TeamBuilderRequest, ConfirmTeamRequest
)

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from slowapi import Limiter, _rate_limit_exceeded_handler # type: ignore
from slowapi.util import get_remote_address # type: ignore
from slowapi.errors import RateLimitExceeded # type: ignore

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
    
app = FastAPI(lifespan=lifespan)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.getenv("GOOGLE_API_KEY"):
    print("Warning: GOOGLE_API_KEY not found")

creative_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.4)

logic_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

def check_and_release_users(session: Session):
    busy_users = session.exec(
        select(User).where(User.is_available == False, User.active_project_end_date != None)
    ).all()
    
    now = datetime.now()
    updated_count = 0
    
    for user in busy_users:
        if now > user.active_project_end_date:
            user.is_available = True
            user.team_name = None
            user.active_project_end_date = None
            session.add(user)
            updated_count += 1
            
    if updated_count > 0:
        session.commit()
        print("⏰ Auto-released {updated_count} users because projects ended.")

@app.get("/")
@app.head("/")
def read_root():
    return {"status": "I am awake!", "service": "4Elements API"}

def calculate_disc_score(answers: List[Answer]):
    # 1. ตั้งต้นที่ 0 (หรือจะตั้งที่ 12 เพื่อกันติดลบก็ได้)
    scores = {'D': 0, 'I': 0, 'S': 0, 'C': 0}
    
    raw_most = {'D': 0, 'I': 0, 'S': 0, 'C': 0}
    raw_least = {'D': 0, 'I': 0, 'S': 0, 'C': 0}

    for ans in answers:
    
        m = ans.most_value.upper()
        if m in scores:
            scores[m] += 1
            raw_most[m] += 1
            
        l = ans.least_value.upper()
        if l in scores:
            scores[l] -= 1 
            raw_least[l] += 1

    for key in scores:
        scores[key] += 15
        
    max_type = max(scores, key=scores.get)
    animals = {'D': 'กระทิง', 'I': 'อินทรี', 'S': 'หนู', 'C': 'หมี'}
    
    return max_type, animals[max_type], scores

@app.post("/submit-assessment", response_model=UserResult)
def submit_assessment(submission: UserSubmission, session: Session = Depends(get_session)):

    dom_type, animal, raw_scores = calculate_disc_score(submission.answers)
    
    user_db = User(
        name=submission.name,
        dominant_type=dom_type,
        animal=animal,
        score_d=raw_scores['D'],
        score_i=raw_scores['I'],
        score_s=raw_scores['S'],
        score_c=raw_scores['C']
    )
    
    session.add(user_db)
    session.commit()
    session.refresh(user_db) 
    
    return {
        "id": user_db.id,
        "name": user_db.name,
        "dominant_type": user_db.dominant_type,
        "animal": user_db.animal,
        "scores": raw_scores,
        "team_name": user_db.team_name,
        "is_available": user_db.is_available
    }

@app.get("/users", response_model=List[UserResult])
def get_users(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    
    results = []
    for user in users:
        results.append({
            "id": user.id,
            "name": user.name,
            "dominant_type": user.dominant_type,
            "animal": user.animal,
            "scores": {"D": user.score_d, "I": user.score_i, "S": user.score_s, "C": user.score_c},
            "team_name": user.team_name,
            "is_available": user.is_available
        })
    return results

@app.delete("/users/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    session.delete(user)
    session.commit()
    return {"message": "User deleted successfully"}

# ... (Imports เดิม)


@app.post("/match-ai")
@limiter.limit("10/minute")
async def match_users_ai(request: Request, req: MatchRequest, session: Session = Depends(get_session)):
    u1 = session.get(User, req.user1_id)
    u2 = session.get(User, req.user2_id)
    
    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="Users not found")
        
    diff_d = abs(u1.score_d - u2.score_d)
    diff_i = abs(u1.score_i - u2.score_i)
    diff_s = abs(u1.score_s - u2.score_s)
    diff_c = abs(u1.score_c - u2.score_c)
    
    total_diff = diff_d + diff_i + diff_s + diff_c

    print(f"User 1 ({u1.name}) Scores: D{u1.score_d} I{u1.score_i} S{u1.score_s} C{u1.score_c}")
    print(f"User 2 ({u2.name}) Scores: D{u2.score_d} I{u2.score_i} S{u2.score_s} C{u2.score_c}")
    print(f"Total Diff: {total_diff}")
    
    
    synergy_bonus = int(total_diff * 0.8)
    calculated_score = 60 + synergy_bonus
    
    # Cap ไว้ไม่ให้เกิน 98% (ให้ดูสมจริง ไม่เฟค 100%)
    calculated_score = min(98, calculated_score)
    
    # Prompt จับคู่ (ฉบับกระชับ + บังคับ Bullet)
    match_prompt = ChatPromptTemplate.from_template("""
    Role: You are "4Elements Master", an expert in team chemistry and DISC assessment.
    
    Analyze the synergy between:
    1. {name1} ({type1}) -> Scores: D={d1}, I={i1}, S={s1}, C={c1}
    2. {name2} ({type2}) -> Scores: D={d2}, I={i2}, S={s2}, C={c2}
    
    **PRE-CALCULATED SYNERGY SCORE:** {score}%
    (Note: This score is calculated based on mathematical compatibility logic. You MUST use this number in the JSON output).

    **CRITICAL INSTRUCTION:**
    Generate an analysis that justifies this score ({score}%).
    - If Score < 75: Focus on where they might clash slightly, but stay positive.
    - If Score > 85: Praise their perfect balance and compatibility.
    
    **OUTPUT JSON FORMAT ONLY:**
    {{
      "synergy_score": {score},
      "synergy_name": "Creative Thai Pair Name (e.g. คู่กัดขิงก็รา, หยินหยางสมบูรณ์แบบ)",
      "element_visual": "Fire & Wind / Water & Earth",
      "analysis": "2-3 sentences in Thai matching the score of {score}%.",
      "pro_tip": "One actionable advice (Thai)."
    }}
    
    Do not use Markdown. Just raw JSON.
    """)
    
    chain = match_prompt | logic_llm | StrOutputParser()
    
    try:
        raw_result = await chain.ainvoke({
            "name1": u1.name, "type1": u1.animal, "d1": u1.score_d, "i1": u1.score_i, "s1": u1.score_s, "c1": u1.score_c,
            "name2": u2.name, "type2": u2.animal, "d2": u2.score_d, "i2": u2.score_i, "s2": u2.score_s, "c2": u2.score_c,
            "score": calculated_score
        })
        
        cleaned_json = raw_result.replace("```json", "").replace("```", "").strip()
        analysis_json = json.loads(cleaned_json)
        
    except Exception as e:
        analysis_json = {
            "synergy_score": calculated_score,
            "synergy_name": "การจับคู่แห่งโชคชะตา",
            "element_visual": "Unknown",
            "analysis": "ขออภัย AI ประมวลผลผิดพลาด แต่คะแนนคำนวณได้ตามนี้ครับ",
            "pro_tip": "ลองใหม่อีกครั้งนะครับ",
            "error_raw": str(e)
        }
    
    return {
        "user1": u1,
        "user2": u2,
        "ai_analysis": analysis_json
    }
    
@app.get("/users/{user_id}/analysis")
async def analyze_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.analysis_result:
        print(f"✨ Load analysis for {user.name} from Database (No AI call)")
        try:
            # ดึง Text จาก DB มาแปลงกลับเป็น JSON
            cached_analysis = json.loads(user.analysis_result)
            
            return {
                "user": {
                    "id": user.id, "name": user.name, "dominant_type": user.dominant_type, "animal": user.animal,
                    "scores": {"D": user.score_d, "I": user.score_i, "S": user.score_s, "C": user.score_c}
                },
                "analysis": cached_analysis
            }
        except Exception as e:
            print("⚠️ Cache corrupted, regenerating...")
    
    print(f"🔮 Calling AI for {user.name}...")
    # Prompt สำหรับวิเคราะห์คนเดียว (ฉบับแก้: ห้ามพูดชื่อซ้ำในคู่หู)
    analysis_prompt = ChatPromptTemplate.from_template("""
    Role: You are a "Friendly Personality Analyst MALE" who uses the 4 Animals (DISC) framework.
    Your personality: Warm, Insightful, Direct but Polite, like a supportive senior colleague.
    Language Style: Thai Spoken Language (ภาษาพูดแบบสุภาพ), Casual, Accessible, Encouraging. 
    (Avoid heavy slang/memes. Avoid textbook language. Just talk normally).
    
    User Profile:
    Name: {name}
    Scores: Bull(D)={d}, Eagle(I)={i}, Rat(S)={s}, Bear(C)={c}
    Dominant Type: {dom} ({animal})

    Task: Analyze this person in THAI language.
    
    **CRITICAL OUTPUT RULES:**
    1. **PLAIN TEXT ONLY:** No HTML tags.
    2. **NO MARKDOWN:** No bold (**), no headers (##).
    3. **Lists:** Use a simple hyphen "-" for lists. Do NOT use "•" or numbers.
    4. **NO REPETITION in Partner:** In 'compatible_with', DO NOT repeat the animal name in the explanation part.
       - ❌ BAD: "หนู (Rat): หนูจะช่วย..."
       - ✅ GOOD: "หนู (Rat) จะช่วย..." (Start with verb/action directly)
    5. **Concise:** Keep sentences clear and direct.
    
    **Matching Logic (Use this rule):**
    - High D pairs best with High S (To balance speed with stability).
    - High I pairs best with High C (To balance ideas with precision).
    - High S pairs best with High D (Needs a driver).
    - High C pairs best with High I (Needs a visionary).
    - If Hybrid, choose the partner that balances the *Highest* score.
    
    Return JSON ONLY with these keys:
    1. "title": A catchy archetype title using Animal metaphors (e.g. "กระทิงยอดนักกลยุทธ์").
    2. "element_desc": A DETAILED breakdown of their nature. 
       - MUST provide 1-2 distinct bullet points (-). 
       - Explain the interaction between their dominant and secondary animals/elements in depth but not too long.
       - Describe how others see them vs how they really are.
    3. "personality": Key strengths. Use "-" for 3-4 distinct bullet points.
    4. "weakness": Potential blind spots. Use "-" for bullet points.
    5. "work_style": How they behave in a work setting 3-4 distinct bullet points.
    6. "compatible_with": Which Animal type is their best partner? 
       Format: "Animal Name (Type) Explanation"
       (Example: "หมี (Bear) จะช่วยเสริมเรื่องความละเอียด...")
    
    Do not add Markdown code blocks. Just raw JSON.
    """)

    chain = analysis_prompt | creative_llm | StrOutputParser()
    
    # ส่งคะแนนไปให้ AI
    raw_result = await chain.ainvoke({
        "name": user.name,
        "d": user.score_d, "i": user.score_i, "s": user.score_s, "c": user.score_c,
        "dom": user.dominant_type, "animal": user.animal
    })

    try:
        cleaned_json = raw_result.replace("```json", "").replace("```", "").strip()
        analysis_json = json.loads(cleaned_json)
        user.analysis_result = json.dumps(analysis_json, ensure_ascii=False)
        session.add(user)
        session.commit()
        print("💾 Saved analysis to Database!")
    except:
        analysis_json = {"error": "AI Error", "raw": raw_result}

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "dominant_type": user.dominant_type,
            "animal": user.animal,
            "scores": {
                "D": user.score_d,
                "I": user.score_i,
                "S": user.score_s,
                "C": user.score_c
            }
        },
        "analysis": analysis_json
    }

@app.post("/auto-group-teams")
@limiter.limit("5/minute")
async def auto_group_teams(request: Request, req: GroupingRequest, session: Session = Depends(get_session)):
    # 1. ดึงข้อมูลทุกคนในบริษัท
    users = session.exec(select(User)).all()
    
    total_people = len(users)
    if total_people == 0:
        raise HTTPException(status_code=400, detail="ยังไม่มีพนักงานในระบบเลยครับ เพิ่มคนก่อนนะ!")
    
    if total_people < req.num_teams:
        raise HTTPException(status_code=400, detail=f"คนไม่พอครับ! มีแค่ {total_people} คน แต่จะแบ่ง {req.num_teams} ทีม")
    
    if total_people / req.num_teams < 2:
         raise HTTPException(
            status_code=400, 
            detail=f"จำนวนทีมเยอะเกินไปครับ! เฉลี่ยแล้วเหลือทีมละไม่ถึง 2 คน"
        )
    
    min_per_team = math.floor(total_people / req.num_teams)
    max_per_team = math.ceil(total_people / req.num_teams)
    
    if min_per_team == max_per_team:
        size_rule = f"Exactly {min_per_team} members per team."
    else:
        size_rule = f"Between {min_per_team} to {max_per_team} members per team."
        
    roster_text = ""
    for u in users:
        # ส่งไปทั้งชื่อและคะแนน เพื่อให้ AI เกลี่ยพลังถูก
        roster_text += f"- {u.name} (Type: {u.animal}, D={u.score_d}, I={u.score_i}, S={u.score_s}, C={u.score_c})\n"

    grouping_prompt = ChatPromptTemplate.from_template("""
    Role: You are an expert in building balanced high-performance teams.
    
    Task: Divide these {total_people} people into {num_teams} teams.
    
    Current Roster:
    {roster}
    
    **STRATEGY RULES:**
    1. **Distribute Scarce Roles:** Spread rare animals (e.g. Rats) across teams.
    2. **Balance is King:** Mix Drivers (D), Influencers (I), Supporters (S), Analysts (C).
    3. **Everyone Assigned:** Every single person MUST be in a team.
    4. **STRICT TEAM SIZE:** {size_rule} (Do NOT dump leftovers in the last team!).
    
    **CRITICAL OUTPUT RULES:**
    1. **Role (Job Class):** - MUST be a **Short Thai Title** (Max 2 words). 
       - NO Nicknames in role. NO brackets. NO English.
       - Example : "ผู้นำเชิงกลยุทธ์", "ผู้ประสานงาน", "ผู้นำ"

    2. **Strength:** Mention **EVERY MEMBER BY NAME**. Explain specifically what each person contributes.

    3. **Management Tip (Weakness Field):** - **NEVER SAY** "This team lacks X" or "Should add Y". (You built this team, so don't complain about it!)
       - **INSTEAD, FOCUS ON** "How to manage this specific combination".
       - Example: "ทีมนี้พลังงานสูงมาก หัวหน้าทีมควรเน้นกำหนดเป้าหมายให้ชัด แล้วปล่อยให้พวกเขาลุยเอง ไม่ควรจู้จี้จุกจิก"
       - Example: "ทีมนี้เน้นความละเอียดรอบคอบ แต่อาจตัดสินใจช้า หัวหน้าทีมควรกำหนด Deadline ให้ชัดเจนเพื่อกระตุ้นความเร็ว"
       
    4. **Animal:** You MUST map the animal type back to the member object correctly based on the roster.
    
    **REQUIRED JSON STRUCTURE:**
    {{
      "teams": [
        {{
          "team_name": "Thai Team Name",
          "members": [
             {{
                "name": "Exact Name from Roster",
                "animal": "Animal Type (e.g. กระทิง, อินทรี)",
                "role": "Thai Role Description"
             }}
          ],
          "strength": "Team strength analysis (mentioning names)",
          "weakness": "Management advice"
        }}
      ]
    }}
    
    Return ONLY valid JSON. Do not use Markdown.
    """)
    
    chain = grouping_prompt | creative_llm | StrOutputParser()
    
    try:
        raw_result = await chain.ainvoke({
            "total_people": total_people,
            "num_teams": req.num_teams,
            "roster": roster_text,
            "size_rule": size_rule
        })
        
        cleaned_json = raw_result.replace("```json", "").replace("```", "").strip()
        result_json = json.loads(cleaned_json)
        
        return result_json

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail="AI processing error")
    
@app.patch("/users/{user_id}/name", response_model=UserResult)
def update_user_name(user_id: int, update_data: UserNameUpdate, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.name = update_data.name
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {
        "id": user.id,
        "name": user.name,
        "dominant_type": user.dominant_type,
        "animal": user.animal,
        "scores": {"D": user.score_d, "I": user.score_i, "S": user.score_s, "C": user.score_c},
        "team_name": user.team_name,
        "is_available": user.is_available
    }
    


@app.get("/users/roster")
def get_user_roster(session: Session = Depends(get_session)):
    check_and_release_users(session)
    users = session.exec(select(User).order_by(User.is_available.desc(), User.name)).all()
    return users

    
@app.get("/users/available")
def get_available_users(session: Session = Depends(get_session)):
    check_and_release_users(session)
    users = session.exec(select(User).where(User.is_available == True)).all()
    return users

@app.get("/users/{user_id}")
def get_user_by_id(user_id: int, session: Session = Depends(get_session)):
    # ค้นหา User ตาม ID
    user = session.get(User, user_id)
    
    if not user:
        # ถ้าหาไม่เจอ ให้ส่ง 404 กลับไป
        raise HTTPException(status_code=404, detail="User not found")
        
    return user
# 2. ให้ AI แนะนำลูกน้อง (Recommend)
@app.post("/recommend-team-members")
@limiter.limit("20/minute")
async def recommend_team_members(request: Request, req: TeamBuilderRequest, session: Session = Depends(get_session)):
    # ดึงหัวหน้า
    leader = session.get(User, req.leader_id)
    if not leader: raise HTTPException(status_code=404, detail="Leader not found")
    
    # ดึงคนที่ว่างอยู่ (ไม่รวมหัวหน้า)
    leader_dict = {
        "id": leader.id,
        "name": leader.name,
        "animal": leader.animal,
        "dominant_type": leader.dominant_type,
        "scores": { # แถม scores ให้ด้วย
            "D": leader.score_d,
            "I": leader.score_i,
            "S": leader.score_s,
            "C": leader.score_c
        }
    }
    candidates = session.exec(select(User).where(User.team_name == None, User.id != req.leader_id)).all()
    
    if len(candidates) < req.member_count:
        raise HTTPException(status_code=400, detail=f"คนว่างไม่พอครับ! ต้องการ {req.member_count} แต่เหลือแค่ {len(candidates)}")

    # เตรียมข้อมูลส่ง AI
    roster_text = ""
    for u in candidates:
        roster_text += f"- [ID: {u.id}] {u.name} ({u.animal}, {u.dominant_type})\n"

    # Prompt สั่ง AI หาคนตามกลยุทธ์
    builder_prompt = ChatPromptTemplate.from_template("""
    Role: You are an expert HR Specialist.
    Task: Select exactly {count} members from the "Candidates" list to join the "Leader".
    
    Leader: {leader_name} ({leader_animal})
    Strategy: {strategy}
    
    Strategy Guide:
    - **Balanced (สมดุล):** Mix D, I, S, C to cover all bases.
    - **Aggressive (สายลุย):** Focus on High D and High I (Speed & Result).
    - **Creative (สายไอเดีย):** Focus on High I and High C (Innovation & Detail).
    - **Supportive (สายซัพ):** Focus on High S and High C (Stability & Process).
    
    Candidates:
    {roster}
    
    **CRITICAL OUTPUT RULES:**
    1. **JSON ONLY:** Return strictly valid JSON.
    2. **"reason" Field Format:**
       - Write in **PLAIN THAI TEXT** only.
       - ❌ DO NOT use Markdown (No bold `**`, No italics `*`, No headers `#`).
       - ❌ DO NOT use bullet points (`-` or `•`) or numbered lists.
       - Write as a single, smooth paragraph.
    
    **OUTPUT JSON:**
    {{
      "selected_ids": [1, 5, ...], 
      "reason": "เขียนเหตุผลเป็นภาษาไทยแบบย่อหน้าเดียว ไม่ต้องมี bullet point ไม่ต้องทำตัวหนา",
      "suggested_team_name": "Creative Team Name"
    }}
    """)

    chain = builder_prompt | creative_llm | StrOutputParser()
    
    raw = await chain.ainvoke({
        "count": req.member_count,
        "leader_name": leader.name,
        "leader_animal": leader.animal,
        "strategy": req.strategy,
        "roster": roster_text
    })
    
    try:
        res_json = json.loads(raw.replace("```json", "").replace("```", "").strip())
        
        selected_members = []
        members_snapshot_data = [] # เก็บไว้ลง Log

        for uid in res_json['selected_ids']:
            u = next((c for c in candidates if c.id == uid), None)
            if u: 
                user_dict = {
                    "id": u.id,
                    "name": u.name,
                    "animal": u.animal,
                    "dominant_type": u.dominant_type,
                    "scores": { # แถม scores ให้ด้วยเลย Frontend จะได้กราฟขึ้น
                        "D": u.score_d,
                        "I": u.score_i,
                        "S": u.score_s,
                        "C": u.score_c
                    }
                }
                selected_members.append(user_dict)
                
                members_snapshot_data.append({
                    "id": u.id,
                    "name": u.name,
                    "animal": u.animal,
                    "dominant_type": u.dominant_type
                })
            
        # 7. สร้าง TeamLog
        new_log = TeamLog(
            leader_id=leader.id,
            team_name=res_json['suggested_team_name'],
            strategy=req.strategy,
            reason=res_json['reason'],
            members_snapshot=members_snapshot_data,
            status="generated"
        )
        session.add(new_log)
        session.commit()
        session.refresh(new_log)

        # 8. ส่งกลับ Frontend
        return {
            "leader": leader_dict,
            "members": selected_members,
            "reason": res_json['reason'],
            "team_name": res_json['suggested_team_name'],
            "log_id": new_log.id
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

# 3. บันทึกทีมจริง (Update DB)
@app.post("/confirm-team")
def confirm_team(req: ConfirmTeamRequest, session: Session = Depends(get_session)):
    # 1. หา Log
    log_entry = session.get(TeamLog, req.log_id)
    if not log_entry:
        raise HTTPException(status_code=404, detail="Log not found")
        
    log_entry.status = "confirmed"
    log_entry.project_start_date = req.start_date # ✅ บันทึกวันเริ่ม
    log_entry.project_end_date = req.end_date     # ✅ บันทึกวันจบ
    session.add(log_entry)
    
    def update_user_status(uid: int):
        u = session.get(User, uid)
        if u:
            u.team_name = log_entry.team_name
            u.is_available = False
            u.active_project_end_date = req.end_date
            session.add(u)

    update_user_status(log_entry.leader_id)
    for m in log_entry.members_snapshot:
        update_user_status(m['id'])
            
    session.commit()
    return {"message": "Team confirmed, dates set, and users are now busy!"}

@app.get("/team-logs")
def get_team_logs(leader_id: Optional[int] = None, session: Session = Depends(get_session)):
    # เรียงจากใหม่ไปเก่า
    statement = select(TeamLog).order_by(TeamLog.created_at.desc())
    
    if leader_id:
        statement = statement.where(TeamLog.leader_id == leader_id)
        
    logs = session.exec(statement).all()

    results = []
    for log in logs:
        leader = session.get(User, log.leader_id)
        # แปลง Log เป็น Dict
        log_dict = log.model_dump() # หรือ .dict() ถ้าใช้ pydantic รุ่นเก่า
        # เพิ่มข้อมูลหัวหน้า
        log_dict["leader_name"] = leader.name if leader else "Unknown"
        log_dict["leader_animal"] = leader.animal if leader else "?"
        
        results.append(log_dict)
        
    return results

# --- backend/main.py ---

@app.post("/team-logs/{log_id}/disband")
def disband_team(log_id: int, session: Session = Depends(get_session)):
    # 1. หา Log
    log = session.get(TeamLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
        
    if log.status != "confirmed":
        return {"message": "Team is not active, cannot disband."}

    log.status = "disbanded"
    log.project_start_date = None
    log.project_end_date = None 
    session.add(log)

    def free_user(uid: int):
        u = session.get(User, uid)
        if u and u.team_name == log.team_name:
            u.team_name = None
            u.is_available = True       
            u.active_project_end_date = None 
            session.add(u)

    # ปลดหัวหน้า
    free_user(log.leader_id)
    # ปลดลูกน้อง
    for m in log.members_snapshot:
        free_user(m['id'])
            
    session.commit()
    return {"message": "Team disbanded successfully"}

@app.delete("/team-logs/{log_id}")
def delete_team_log(log_id: int, session: Session = Depends(get_session)):
    log = session.get(TeamLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
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
    
    return {"message": "Deleted log and freed users successfully"}

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

@app.post("/reset-teams")
def reset_teams(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    for user in users:
        user.team_name = None
        session.add(user)
    session.commit()
    return {"message": "All users are now free!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)