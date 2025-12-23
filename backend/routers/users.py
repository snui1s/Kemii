from fastapi import APIRouter, HTTPException, Depends, Request
from sqlmodel import Session, select
from database import get_session
from models import User
from schemas import OceanSubmission, UserProfile, MatchRequest
from auth import create_access_token
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dependencies import llm, check_and_release_users
import json
import os

router = APIRouter()

@router.post("/submit-assessment", response_model=UserProfile)
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

@router.get("/users/{user_id}/analysis")
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

@router.get("/users", response_model=list[UserProfile])
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


@router.post("/match-ai")
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

@router.get("/users/roster")
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
