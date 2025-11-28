import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

# --- FastAPI & Pydantic ---
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- SQLModel ---
from sqlmodel import SQLModel, Field, Session, create_engine, select

# --- AI Library ---
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# --- Database Setup (SQLModel) ---
DB_NAME = "zoologic.db"
sqlite_url = f"sqlite:///{DB_NAME}"
connect_args = {"check_same_thread": False} # จำเป็นสำหรับ SQLite ใน FastAPI
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Dependency เพื่อส่ง Session ให้แต่ละ Endpoint
def get_session():
    with Session(engine) as session:
        yield session

# --- SQLModel Tables (Database Schema) ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    dominant_type: str
    animal: str
    score_d: int
    score_i: int
    score_s: int
    score_c: int

# --- Pydantic Models (For API Input/Output) ---
class Answer(BaseModel):
    question_id: int
    value: str 

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

# --- App Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- AI Setup ---
if not os.getenv("GOOGLE_API_KEY"):
    print("⚠️ Warning: GOOGLE_API_KEY not found")

# ใช้ 1.5-flash เพื่อความเสถียร (2.5 ยังไม่มาใน public API ทั่วไป ณ ปัจจุบัน)
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7)

# --- Logic Helper ---
def calculate_disc_score(answers: List[Answer]):
    scores = {'D': 0, 'I': 0, 'S': 0, 'C': 0}
    for ans in answers:
        val = ans.value.upper()
        if val in scores:
            scores[val] += 1
    
    max_type = max(scores, key=scores.get)
    animals = {'D': 'กระทิง', 'I': 'อินทรี', 'S': 'หนู', 'C': 'หมี'}
    return max_type, animals[max_type], scores

# --- API Endpoints ---

# 1. ส่งผลประเมิน (Create)
@app.post("/submit-assessment", response_model=UserResult)
def submit_assessment(submission: UserSubmission, session: Session = Depends(get_session)):
    # คำนวณคะแนน
    dom_type, animal, raw_scores = calculate_disc_score(submission.answers)
    
    # สร้าง Object User เพื่อเตรียมบันทึก
    user_db = User(
        name=submission.name,
        dominant_type=dom_type,
        animal=animal,
        score_d=raw_scores['D'],
        score_i=raw_scores['I'],
        score_s=raw_scores['S'],
        score_c=raw_scores['C']
    )
    
    # บันทึกลง DB
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

# 2. ดูรายชื่อทั้งหมด (Read All)
@app.get("/users", response_model=List[UserResult])
def get_users(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    
    # แปลงข้อมูลกลับเป็น Format ที่ Frontend ต้องการ
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

# 3. ลบคน (Delete)
@app.delete("/users/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    session.delete(user)
    session.commit()
    return {"message": "User deleted successfully"}

# 4. จับคู่ 1-on-1 (AI Match)
@app.post("/match-ai")
async def match_users_ai(req: MatchRequest, session: Session = Depends(get_session)):
    # ดึง User 2 คนด้วย SQLModel
    u1 = session.get(User, req.user1_id)
    u2 = session.get(User, req.user2_id)
    
    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="Users not found")
        
    # Prompt จับคู่
    match_prompt = ChatPromptTemplate.from_template("""
    Role: You are "ZooLogic AI", a team compatibility expert.
    Analyze: {name1} ({type1}) vs {name2} ({type2})
    Scores 1: D={d1}, I={i1}, S={s1}, C={c1}
    Scores 2: D={d2}, I={i2}, S={s2}, C={c2}
    
    Output in Thai (Fun & Insightful):
    1. Metaphor: Describe them as a duo (e.g. Driver & Navigator).
    2. Dynamic: How they work together.
    3. Warning: Potential conflict.
    4. Advice: 1 tip for each.
    """)
    
    chain = match_prompt | llm | StrOutputParser()
    analysis = await chain.ainvoke({
        "name1": u1.name, "type1": u1.animal, "d1": u1.score_d, "i1": u1.score_i, "s1": u1.score_s, "c1": u1.score_c,
        "name2": u2.name, "type2": u2.animal, "d2": u2.score_d, "i2": u2.score_i, "s2": u2.score_s, "c2": u2.score_c
    })
    
    return {
        "user1": u1.name, "user2": u2.name,
        "ai_analysis": analysis
    }

# 5. วิเคราะห์ภาพรวมทั้งทีม (Team Analysis)
@app.get("/analyze-team")
async def analyze_team_structure(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    
    if not users:
        return {"analysis": "ยังไม่มีสมาชิกในทีมครับ เพิ่มคนเข้ามาก่อนนะ!"}

    # เตรียม Data ส่งให้ AI
    type_counts = {"D": 0, "I": 0, "S": 0, "C": 0}
    members_list = []
    
    for u in users:
        type_counts[u.dominant_type] += 1
        members_list.append(f"- {u.name}: {u.dominant_type} ({u.animal})")
    
    team_prompt = ChatPromptTemplate.from_template("""
    Role: You are "ZooLogic Coach", a strategic team manager expert.
    
    Context: I am building a project team. Here is my current roster:
    {team_list}
    
    Stats:
    - Bulls (D - Driver/Forward): {cnt_d}
    - Eagles (I - Influencer/Midfielder): {cnt_i}
    - Rats (S - Supporter/Defender): {cnt_s}
    - Bears (C - Analyst/Tactician): {cnt_c}
    
    Task: Analyze this team structure in THAI.
    1. **Team Formation:** If this were a football team, is it balanced? 
    2. **Strengths:** What will this team be good at?
    3. **Weaknesses:** What is missing? What risk should I watch out for?
    4. **Hiring Advice:** Who should I recruit next to balance the team?
    
    Keep it professional but use football metaphors.
    """)
    
    chain = team_prompt | llm | StrOutputParser()
    analysis = await chain.ainvoke({
        "team_list": "\n".join(members_list),
        "cnt_d": type_counts['D'],
        "cnt_i": type_counts['I'],
        "cnt_s": type_counts['S'],
        "cnt_c": type_counts['C']
    })
    
    return {
        "total_members": len(users),
        "distribution": type_counts,
        "ai_analysis": analysis
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)