import os
import json
from datetime import datetime
from typing import List, Optional, Dict
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session, select, SQLModel
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from database import create_db_and_tables, get_session
from models import User, TeamLog, Quest
from schemas import (
    OceanSubmission, UserProfile, MatchRequest, TeamBuilderRequest, 
    ConfirmTeamRequest, TeamRecommendation, ReviveRequest, UpdateSkillsRequest,
    CreateQuestRequest, QuestResponse, ApplyQuestRequest, MatchScoreResponse
)
from skills_data import DEPARTMENTS
from quest_ai import generate_quest, calculate_match_score, find_best_candidates
from auth import create_access_token


load_dotenv()

# --- AI CONFIG ---
if not os.getenv("GOOGLE_API_KEY"):
    print("GOOGLE_API_KEY not found in .env")

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
@app.head("/")
def read_root():
    return {"status": "I am awake!", "service": "Kemii API"}

# === SKILLS ENDPOINTS ===
@app.get("/skills")
def get_skills():
    """Get all skill departments and skills"""
    return {"departments": DEPARTMENTS}

@app.put("/users/{user_id}/skills")
def update_user_skills(user_id: int, req: UpdateSkillsRequest, session: Session = Depends(get_session)):
    """Update user's skills"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert to JSON and save
    skills_data = [{"name": s.name, "level": s.level} for s in req.skills]
    user.skills = json.dumps(skills_data, ensure_ascii=False)
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {"message": "Skills updated", "skills": skills_data}

# NOTE: /users/roster MUST appear BEFORE /users/{user_id} to avoid routing conflict
@app.get("/users/roster")
def get_user_roster(session: Session = Depends(get_session)):
    """Get user roster for team building"""
    check_and_release_users(session)
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

@app.get("/users/{user_id}/skills")
def get_user_skills(user_id: int, session: Session = Depends(get_session)):
    """Get user's skills"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    skills = json.loads(user.skills) if user.skills else []
    return {"user_id": user_id, "skills": skills}

@app.get("/users/{user_id}")
def get_user_by_id(user_id: int, session: Session = Depends(get_session)):
    """Get user by ID"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

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

# === GLOBAL HELPERS & CONSTANTS ===
TAU = 0.625
LAMBDA = 2.0

def get_stats(u):
    return {
        "O": u.ocean_openness or 0,
        "C": u.ocean_conscientiousness or 0,
        "E": u.ocean_extraversion or 0,
        "A": u.ocean_agreeableness or 0,
        "N": u.ocean_neuroticism or 0
    }

def calculate_academic_cost(team_stats_list):
    """
    Calculate team cost using the academic formula:
    Cost = 1.5×Var*(C) + 1.5×Var*(A) + 1×Var*(E) + 1×Var*(O) + 1×N̄* + λ×max(0, τ - Ā*)
    """
    if len(team_stats_list) < 2:
        return float('inf')  # Can't calculate variance with < 2 members
    
    C_values = [s["C"] for s in team_stats_list]
    A_values = [s["A"] for s in team_stats_list]
    E_values = [s["E"] for s in team_stats_list]
    O_values = [s["O"] for s in team_stats_list]
    N_values = [s["N"] for s in team_stats_list]
    
    def variance(values):
        n = len(values)
        mean_val = sum(values) / n
        return sum((x - mean_val) ** 2 for x in values) / n
    
    def var_star(values):
        return variance(values) / 400
    
    def xbar_star(values):
        mean_val = sum(values) / len(values)
        return (mean_val - 10) / 40
    
    N_bar_star = xbar_star(N_values)
    A_bar_star = xbar_star(A_values)
    
    cost = (
        1.5 * var_star(C_values) +
        1.5 * var_star(A_values) +
        1.0 * var_star(E_values) +
        1.0 * var_star(O_values) +
        1.0 * N_bar_star +
        LAMBDA * max(0, TAU - A_bar_star)
    )
    return cost

@app.get("/users")
def get_users(session: Session = Depends(get_session)):
    # ดึงข้อมูลทั้งหมด เรียงตาม ID ล่าสุด
    users = session.exec(select(User).order_by(User.id.desc())).all()
    
    results = []
    for u in users:
        skills = json.loads(u.skills) if u.skills else []
        results.append({
            "id": u.id,
            "name": u.name,
            "character_class": u.character_class,
            "level": u.level,
            "ocean_openness": u.ocean_openness or 0,
            "ocean_conscientiousness": u.ocean_conscientiousness or 0,
            "ocean_extraversion": u.ocean_extraversion or 0,
            "ocean_agreeableness": u.ocean_agreeableness or 0,
            "ocean_neuroticism": u.ocean_neuroticism or 0,
            "skills": skills,
            "is_available": u.is_available
        })
    return results


@app.post("/match-ai")
# @limiter.limit("10/minute") # Uncomment ถ้าจะใช้ Rate Limit
async def match_users_ai(request: Request, req: MatchRequest, session: Session = Depends(get_session)):
    u1 = session.get(User, req.user1_id)
    u2 = session.get(User, req.user2_id)
    
    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="Heroes not found")
        
    # === NEW FORMULA ===
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
    
    # Team Rating
    def get_team_rating(s):
        if s >= 80:
            return "Excellent"
        elif s >= 65:
            return "Good"
        elif s >= 50:
            return "Acceptable"
        elif s >= 35:
            return "Risky"
        else:
            return "Not Recommended"
    
    team_rating = get_team_rating(final_score)
    
    # Debug log
    print(f"📊 DEBUG: cost={cost:.4f}, score={score:.2f}")
    print(f"⚔️ Soul Link: {u1.name} ({u1.character_class}) x {u2.name} ({u2.character_class}) = {final_score}% [{team_rating}]")

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
        "ai_analysis": analysis_json,
        "team_rating": team_rating
    }

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

    # Use global helpers
    
    def calculate_team_score(cost):
        """Convert cost to score (0-100)"""
        denominator = 6 + LAMBDA * TAU  # = 7.25
        score = 100 * (1 - (cost / denominator))
        return max(0, min(100, int(round(score))))
    
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
    
    def get_team_rating(s):
        if s >= 80: return "Excellent"
        elif s >= 65: return "Good"
        elif s >= 50: return "Acceptable"
        elif s >= 35: return "Risky"
        else: return "Not Recommended"
    
    team_rating = get_team_rating(final_score)
    print(f"✅ Headhunter Complete: Final Score={final_score}% [{team_rating}]")
    
    # Get selected members (excluding leader)
    selected_members_users = selected_team[1:]  # Exclude leader
    
    # 3. ใช้ AI สร้างชื่อทีมและเหตุผล (แค่ตรงนี้)
    member_names = ", ".join([u.name for u in selected_members_users])
    
    prompt = ChatPromptTemplate.from_template("""
    Role: You are the "Grand Guild Master" naming a newly formed party.
    
    **Party Leader:** {leader_name} (Class: {leader_class})
    **Members:** {member_names}
    **Team Score:** {score}% ({rating})
    **Strategy:** {strategy}
    
    **TASK:** Create an epic Thai team name and explain why this team works well together.
    
    **OUTPUT RULES:**
    - team_name: Creative Thai name (e.g. "ภาคีพิทักษ์เดดไลน์", "กองหน้าล่าโปรเจกต์")
    - reason: 2-3 sentences in Thai explaining the team synergy. NO MARKDOWN.
    
    **JSON OUTPUT:**
    {{
      "team_name": "...",
      "reason": "..."
    }}
    """)
    
    chain = prompt | llm | StrOutputParser()
    
    try:
        raw = await chain.ainvoke({
            "leader_name": leader.name,
            "leader_class": leader.character_class,
            "member_names": member_names,
            "score": final_score,
            "rating": team_rating,
            "strategy": req.strategy
        })
        
        res_json = json.loads(raw.replace("```json", "").replace("```", "").strip())
        team_name = res_json.get('team_name', f"ทีมของ {leader.name}")
        reason = res_json.get('reason', f"ทีมนี้มีคะแนนความเข้ากัน {final_score}% ({team_rating})")
        
    except Exception as e:
        print(f"AI Naming Error: {e}")
        team_name = f"ทีมของ {leader.name}"
        reason = f"ทีมนี้ถูกคัดเลือกด้วย Headhunter Algorithm คะแนนความเข้ากัน {final_score}% ({team_rating})"
    
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


# === QUEST BOARD ENDPOINTS ===

@app.get("/quests")
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
        applicants = json.loads(q.applicants) if q.applicants else []
        
        quest_dict = {
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "rank": q.rank,
            "required_skills": json.loads(q.required_skills),
            "optional_skills": json.loads(q.optional_skills),
            "ocean_preference": json.loads(q.ocean_preference),
            "team_size": q.team_size,
            "leader_id": q.leader_id,
            "leader_name": leader.name if leader else "Unknown",
            "leader_class": leader.character_class if leader else "Novice",
            "status": q.status,
            "applicant_count": len(applicants),
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
                stats = [get_stats(u) for u in team_users]
                cost = calculate_academic_cost(stats)
                quest_dict["harmony_score"] = max(0, 100 - int(cost))
                
        result.append(quest_dict)
    
    return {"quests": result}


@app.post("/quests")
def create_quest(req: CreateQuestRequest, session: Session = Depends(get_session)):
    """Create a new quest using AI to parse the prompt"""
    # Verify leader exists
    leader = session.get(User, req.leader_id)
    if not leader:
        raise HTTPException(status_code=404, detail="Leader not found")
    
    # Generate quest details using AI (AI recommends team_size)
    quest_data = generate_quest(req.prompt, req.deadline_days)
    
    # Create quest in database - use AI-recommended team_size
    quest = Quest(
        title=quest_data["title"],
        description=quest_data["description"],
        rank=quest_data["rank"],
        required_skills=json.dumps(quest_data["required_skills"], ensure_ascii=False),
        optional_skills=json.dumps(quest_data["optional_skills"], ensure_ascii=False),
        ocean_preference=json.dumps(quest_data["ocean_preference"], ensure_ascii=False),
        team_size=quest_data.get("team_size", 3),  # AI-recommended
        leader_id=req.leader_id,
        start_date=req.start_date,
        deadline=req.deadline,
        status="open"
    )
    
    session.add(quest)
    session.commit()
    session.refresh(quest)
    
    return {
        "id": quest.id,
        "title": quest.title,
        "description": quest.description,
        "rank": quest.rank,
        "required_skills": quest_data["required_skills"],
        "optional_skills": quest_data["optional_skills"],
        "ocean_preference": quest_data["ocean_preference"],
        "team_size": quest.team_size,
        "leader_id": quest.leader_id,
        "leader_name": leader.name,
        "leader_class": leader.character_class,
        "status": quest.status,
        "applicant_count": 0,
        "start_date": quest.start_date.isoformat() if quest.start_date else None,
        "deadline": quest.deadline.isoformat() if quest.deadline else None,
        "created_at": quest.created_at.isoformat()
    }


@app.get("/quests/{quest_id}")
def get_quest_detail(quest_id: int, session: Session = Depends(get_session)):
    """Get quest details including applicants"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    leader = session.get(User, quest.leader_id)
    applicant_ids = json.loads(quest.applicants) if quest.applicants else []
    accepted_ids = json.loads(quest.accepted_members) if quest.accepted_members else []
    
    # Get applicant details
    applicants = []
    for uid in applicant_ids:
        user = session.get(User, uid)
        if user:
            applicants.append({
                "id": user.id,
                "name": user.name,
                "character_class": user.character_class,
                "level": user.level
            })
    
    # Get accepted members details
    accepted_members = []
    req_skills = json.loads(quest.required_skills)
    opt_skills = json.loads(quest.optional_skills)
    
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
            
            # Check against optional skills
            for opt in opt_skills:
                if opt['name'] in user_skill_map:
                    matching.append({
                        "name": opt['name'],
                        "level": user_skill_map[opt['name']],
                        "type": "optional"
                    })
            
            # Sort by level desc
            matching.sort(key=lambda x: x['level'], reverse=True)
            
            accepted_members.append({
                "id": user.id,
                "name": user.name,
                "character_class": user.character_class,
                "level": user.level,
                "matching_skills": matching
            })
    
    return {
        "id": quest.id,
        "title": quest.title,
        "description": quest.description,
        "rank": quest.rank,
        "required_skills": json.loads(quest.required_skills),
        "optional_skills": json.loads(quest.optional_skills),
        "ocean_preference": json.loads(quest.ocean_preference),
        "team_size": quest.team_size,
        "leader_id": quest.leader_id,
        "leader_name": leader.name if leader else "Unknown",
        "leader_class": leader.character_class if leader else "Novice",
        "status": quest.status,
        "applicants": applicants,
        "accepted_members": accepted_members,
        "accepted_member_ids": accepted_ids,
        "start_date": quest.start_date.isoformat() if quest.start_date else None,
        "deadline": quest.deadline.isoformat() if quest.deadline else None,
        "created_at": quest.created_at.isoformat()
    }


@app.patch("/quests/{quest_id}/team-size")
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


@app.get("/quests/{quest_id}/team-analysis")
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
    
    # Calculate OCEAN compatibility (low variance = good chemistry)
    def variance(values):
        if len(values) < 2:
            return 0
        mean = sum(values) / len(values)
        return sum((x - mean) ** 2 for x in values) / len(values)
    
    # Lower variance = better team harmony
    c_var = variance(team_ocean["C"])
    a_var = variance(team_ocean["A"])
    avg_neuroticism = sum(team_ocean["N"]) / len(team_ocean["N"]) if team_ocean["N"] else 25
    
    # Team harmony score (higher is better, out of 100)
    # Low C variance + Low A variance + Low avg N = good
    harmony_score = 100 - int((c_var / 200) * 30 + (a_var / 200) * 30 + (avg_neuroticism / 50) * 40)
    harmony_score = max(0, min(100, harmony_score))
    
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

@app.get("/quests/{quest_id}/match/{user_id}")
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


@app.get("/quests/{quest_id}/candidates")
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


@app.post("/quests/{quest_id}/kick/{user_id}")
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


@app.post("/quests/{quest_id}/auto-assign")
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


@app.post("/quests/{quest_id}/apply")
def apply_to_quest(quest_id: int, req: ApplyQuestRequest, session: Session = Depends(get_session)):
    """Apply to a quest"""
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest.status != "open":
        raise HTTPException(status_code=400, detail="Quest is not open for applications")
    
    user = session.get(User, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_available:
        raise HTTPException(status_code=400, detail="User is not available")
    
    # Add to applicants list
    applicants = json.loads(quest.applicants) if quest.applicants else []
    if req.user_id in applicants:
        raise HTTPException(status_code=400, detail="Already applied")
    
    applicants.append(req.user_id)
    quest.applicants = json.dumps(applicants)
    
    session.add(quest)
    session.commit()
    
    return {"message": "Applied successfully", "applicant_count": len(applicants)}


class UpdateStatusRequest(SQLModel):
    user_id: int
    status: str

@app.post("/quests/{quest_id}/status")
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
        quest.project_end_date = datetime.utcnow()
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


@app.post("/quests/{quest_id}/accept/{user_id}")
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


@app.post("/quests/{quest_id}/complete")
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


@app.post("/quests/{quest_id}/cancel")
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


@app.post("/quests/{quest_id}/start")
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)