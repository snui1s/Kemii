import os
import json
from datetime import datetime
from typing import List, Optional, Dict

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session, select
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from database import create_db_and_tables, get_session
from models import User
from schemas import OceanSubmission, UserProfile, MatchRequest
from auth import create_access_token


load_dotenv()

# --- AI CONFIG ---
if not os.getenv("GOOGLE_API_KEY"):
    print("⚠️ Warning: GOOGLE_API_KEY not found in .env")

# ใช้ Gemini Flash เพื่อความไวและราคาถูก
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)

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

@app.get("/")
def read_root():
    return {"status": "RPG AI Online", "service": "Hero Analysis"}

# ----------------------------------------------------------------
# ⚔️ 1. SUBMIT (เหมือนเดิม)
# ----------------------------------------------------------------
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
        is_assessed=True,
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
        "is_assessed": True,
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
        "is_assessed": user.is_assessed
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
    print(f"⚡ Summoning AI for {user.name}...")
    
    # Prompt สั่ง AI สวมบทบาท RPG
    prompt = ChatPromptTemplate.from_template("""
    Role: You are the "Grand Guild Master" of a fantasy world. You analyze adventurers based on their soul stats (OCEAN Psychology).
    Tone: Epic, Inspiring, RPG Fantasy Style, but with accurate psychological insights (Thai Language).
    
    **IMPORTANT TONE GUIDELINES:**
    - Be POSITIVE and ENCOURAGING overall
    - For weaknesses: Frame them as "growth opportunities" or "areas to level up", NOT harsh criticisms
    - Use gentle, supportive language - like a wise mentor giving advice, not a harsh critic
    - Focus on potential for improvement, not flaws
    
    Hero Profile:
    - Name: {name}
    - Class: {rpg_class}
    - Stats (Max 20):
      - INT (Openness): {openness}
      - VIT (Conscientiousness): {conscientiousness}
      - STR (Extraversion): {extraversion}
      - FTH (Agreeableness): {agreeableness}
      - DEX (Neuroticism/Sensitivity): {neuroticism}
      
    Task: Analyze this hero and output a JSON profile.
    
    **OUTPUT RULES:**
    1. **class_title**: Create a cool Tier-2 Class Name.
    2. **prophecy**: A short inspiring paragraph describing their nature and potential.
    3. **strengths**: 3 bullet points of their amazing qualities.
    4. **weaknesses**: 2 bullet points - BUT frame these as "areas for growth" with GENTLE, CONSTRUCTIVE language.
       - WRONG: "ขาดระเบียบวินัยและไม่ใส่ใจในรายละเอียด"
       - RIGHT: "มีโอกาสพัฒนาด้านการวางแผนล่วงหน้า จะช่วยให้บรรลุเป้าหมายได้ดียิ่งขึ้น"
       - Use phrases like: "มีโอกาสพัฒนา...", "อาจลองฝึก...", "จะยิ่งเก่งขึ้นถ้า..."
    5. **best_partner**: 
       - Pick ONE best RPG Class (Mage/Paladin/Warrior/Cleric/Rogue).
       - Explain WHY in 1 short sentence.
       - Format: "[Class Name] - [Reason]"
    
    **CRITICAL FORMATTING RULES:**
    - DO NOT use Markdown bolding (e.g., **text**).
    - DO NOT use headers (e.g., ## Title).
    - Just write plain text.

    **JSON FORMAT ONLY:**
    {{
      "class_title": "...",
      "prophecy": "...",
      "strengths": ["...", "...", "..."],
      "weaknesses": ["gentle constructive feedback...", "gentle constructive feedback..."],
      "best_partner": "Class Name - Reason..."
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
        # Fallback ถ้า AI พัง
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
                "Openness": u.ocean_openness,
                "Conscientiousness": u.ocean_conscientiousness,
                "Extraversion": u.ocean_extraversion,
                "Agreeableness": u.ocean_agreeableness,
                "Neuroticism": u.ocean_neuroticism
            },
            "is_assessed": u.is_assessed
        })
    return results


@app.post("/match-ai")
# @limiter.limit("10/minute") # Uncomment ถ้าจะใช้ Rate Limit
async def match_users_ai(request: Request, req: MatchRequest, session: Session = Depends(get_session)):
    u1 = session.get(User, req.user1_id)
    u2 = session.get(User, req.user2_id)
    
    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="Heroes not found")
        
    # --- 1. คำนวณ Synergy Score (สูตร RPG Basic) ---
    # หลักการ: 
    # - Agreeableness สูงทั้งคู่ = เข้ากันได้ดี (+Score)
    # - Neuroticism สูงทั้งคู่ = เสี่ยงตีกัน (-Score)
    # - Openness ใกล้กัน = คุยภาษาเดียวกันรู้เรื่อง
    
    # ดึงค่าคะแนน (กันเหนียวเป็น 0)
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
    match_prompt = ChatPromptTemplate.from_template("""
    Role: You are the "Grand Guild Master" analyzing the compatibility of two adventurers for a party.
    Tone: Epic, Fantasy RPG, Constructive, Insightful (Thai Language).
    
    **Hero 1:** {name1} (Class: {class1})
    - Stats: O={o1}, C={c1}, E={e1}, A={a1}, N={n1}
    
    **Hero 2:** {name2} (Class: {class2})
    - Stats: O={o2}, C={c2}, E={e2}, A={a2}, N={n2}
    
    **Calculated Synergy:** {score}%
    
    **TASK:**
    Analyze their chemistry based on OCEAN stats but describe it using RPG metaphors.
    - High Synergy (>80%): Describe a legendary combo (e.g. "Shield & Sword", "Light & Shadow").
    - Low Synergy (<50%): Warn about potential conflict (e.g. "Fire & Oil").
    
    **JSON OUTPUT RULES:**
    1. **synergy_name**: A cool combo name in Thai (e.g. "คู่หูทลายดันเจี้ยน", "ดาบโล่พิทักษ์").
    2. **analysis**: A paragraph describing how they work together. Explain how their Classes support (or clash with) each other.
    3. **pro_tip**: Advice for the Party Leader on how to manage this duo.
    
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
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)