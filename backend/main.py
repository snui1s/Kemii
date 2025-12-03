import json
import os
import math
from typing import List, Dict, Optional
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from sqlmodel import SQLModel, Field, Session, create_engine, select

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

DB_NAME = "elements.db"
sqlite_url = f"sqlite:///{DB_NAME}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Dependency เพื่อส่ง Session ให้แต่ละ Endpoint
def get_session():
    with Session(engine) as session:
        yield session

class User(SQLModel, table=True):
    __table_args__ = {"extend_existing": True} 
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    dominant_type: str
    animal: str
    score_d: int
    score_i: int
    score_s: int
    score_c: int
    team_name: Optional[str] = Field(default=None)

class Answer(BaseModel):
    question_id: int
    most_value: str
    least_value: str     

class UserSubmission(BaseModel):
    name: str
    answers: List[Answer]

class UserResult(BaseModel):
    id: int
    name: str
    dominant_type: str
    animal: str
    scores: Dict[str, int]

class MatchRequest(BaseModel):
    user1_id: int
    user2_id: int
    
class GroupingRequest(BaseModel):
    num_teams: int
    
class UserNameUpdate(BaseModel):
    name: str
    
class TeamBuilderRequest(BaseModel):
    leader_id: int
    member_count: int
    strategy: str  # "Balanced", "Aggressive", "Creative", "Supportive"

# Model รับค่าตอนกดยืนยันสร้างทีม (Save)
class ConfirmTeamRequest(BaseModel):
    team_name: str
    member_ids: List[int]

# --- App Setup ---
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

if not os.getenv("GOOGLE_API_KEY"):
    print("Warning: GOOGLE_API_KEY not found")

creative_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.4)

logic_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

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
    session.refresh(user_db) # รีเฟรชเพื่อเอา ID ที่เพิ่งสร้างกลับมา
    
    return {
        "id": user_db.id,
        "name": user_db.name,
        "dominant_type": user_db.dominant_type,
        "animal": user_db.animal,
        "scores": raw_scores
    }

@app.get("/users", response_model=List[UserResult])
def get_users(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "name": u.name,
            "dominant_type": u.dominant_type,
            "animal": u.animal,
            "scores": {"D": u.score_d, "I": u.score_i, "S": u.score_s, "C": u.score_c}
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

# 4. จับคู่ 1-on-1 (AI Match) - ฉบับอัปเกรด JSON & Score
@app.post("/match-ai")
async def match_users_ai(req: MatchRequest, session: Session = Depends(get_session)):
    u1 = session.get(User, req.user1_id)
    u2 = session.get(User, req.user2_id)
    
    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="Users not found")
        
    diff_d = abs(u1.score_d - u2.score_d)
    diff_i = abs(u1.score_i - u2.score_i)
    diff_s = abs(u1.score_s - u2.score_s)
    diff_c = abs(u1.score_c - u2.score_c)
    
    total_diff = diff_d + diff_i + diff_s + diff_c

    calculated_score = min(100, int((total_diff / 60) * 100)) 
    
    match_prompt = ChatPromptTemplate.from_template("""
    Role: You are "4Elements Master", an expert in team chemistry.
    
    Analyze the synergy between:
    1. {name1} ({type1}) -> Scores: D={d1}, I={i1}, S={s1}, C={c1}
    2. {name2} ({type2}) -> Scores: D={d2}, I={i2}, S={s2}, C={c2}
    
    **PRE-CALCULATED SYNERGY SCORE:** {score}%
    (Note: This score is calculated based on mathematical compatibility logic. You MUST use this number in the JSON output).

    **CRITICAL INSTRUCTION:**
    Generate an analysis that justifies this score ({score}%).
    - If Score < 50: Explain the friction/challenges politely.
    - If Score > 80: Praise their perfect balance.
    
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
async def auto_group_teams(req: GroupingRequest, session: Session = Depends(get_session)):
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
        "scores": {"D": user.score_d, "I": user.score_i, "S": user.score_s, "C": user.score_c}
    }
    
@app.get("/users/available")
def get_available_users(session: Session = Depends(get_session)):
    # เลือกคนที่มี team_name เป็น None
    users = session.exec(select(User).where(User.team_name == None)).all()
    return users

# 2. ให้ AI แนะนำลูกน้อง (Recommend)
@app.post("/recommend-team-members")
async def recommend_team_members(req: TeamBuilderRequest, session: Session = Depends(get_session)):
    # ดึงหัวหน้า
    leader = session.get(User, req.leader_id)
    if not leader: raise HTTPException(status_code=404, detail="Leader not found")
    
    # ดึงคนที่ว่างอยู่ (ไม่รวมหัวหน้า)
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
    
    **OUTPUT JSON:**
    {{
      "selected_ids": [1, 5, ...], (List of IDs only)
      "reason": "Why this team works well with this strategy (Thai).",
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
        
        # แปลง IDs กลับเป็น Object User เพื่อส่งให้ Frontend โชว์
        selected_members = []
        for uid in res_json['selected_ids']:
            u = next((c for c in candidates if c.id == uid), None)
            if u: selected_members.append(u)
            
        return {
            "leader": leader,
            "members": selected_members,
            "reason": res_json['reason'],
            "team_name": res_json['suggested_team_name']
        }
    except Exception as e:
        return {"error": str(e)}

# 3. บันทึกทีมจริง (Update DB)
@app.post("/confirm-team")
def confirm_team(req: ConfirmTeamRequest, session: Session = Depends(get_session)):
    for uid in req.member_ids:
        user = session.get(User, uid)
        if user:
            user.team_name = req.team_name
            session.add(user)
    session.commit()
    return {"message": "Team saved successfully!"}

# 4. ล้างทีมทั้งหมด (Reset - เอาไว้เทสต์)
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