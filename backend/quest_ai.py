"""
Quest AI Module - Gemini Integration for Quest Generation
"""
import json
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from skills_data import DEPARTMENTS, get_all_skills

load_dotenv()

# Lazy initialization for LLM
_llm = None

def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3
        )
    return _llm

ALL_SKILLS = get_all_skills()

QUEST_GENERATION_PROMPT = """
คุณคือ AI ที่ช่วยสร้าง Quest (ภารกิจ) สำหรับระบบ HR Gamification

จาก prompt ของผู้ใช้ ให้สร้าง Quest ในรูปแบบ JSON ดังนี้:

**Input Prompt:**
{prompt}

**ระยะเวลา:** {deadline_days} วัน

**Skills ที่มีในระบบ (เลือกจากนี้เท่านั้น):**
{available_skills}

**กรุณา Generate JSON:**
```json
{{
  "title": "ชื่อ Quest ที่ดึงดูด (ภาษาไทย)",
  "description": "คำอธิบายงานภาษาไทยแบบ Professional (2-3 ประโยค ตรงประเด็น)",
  "rank": "<ตัดสินใจเอง ตาม Rank Guidelines ด้านล่าง>",
  "team_size": "<ตัดสินใจเอง 1-5 คน>",
  "required_skills": [
    {{"name": "Skill ที่ต้องมี", "level": 3}}
  ],
  "optional_skills": [
    {{"name": "Skill ที่มีก็ดี", "level": 2}}
  ],
  "ocean_preference": {{
    "high": ["C"],
    "low": ["N"]
  }}
}}
```

**Rank Guidelines (เลือกให้เหมาะกับงานและ deadline):**
- **S**: deadline กระชั้นมาก (1-2 วัน) หรืองานสำคัญมากๆ
- **A**: deadline สั้น (3-5 วัน) หรือต้องการ expert
- **B**: deadline ปกติ (6-10 วัน) งานซับซ้อนพอสมควร
- **C**: deadline ยืดหยุ่น (10-20 วัน) งานทั่วไป
- **D**: deadline ยาว (20+ วัน) หรืองานง่าย beginner friendly

**Team Size Guidelines:**
- งานง่ายๆ 1-2 คน: งานเอกสาร, รายงาน, งาน D/C
- งานปานกลาง 2-3 คน: โปรเจคเล็ก, งาน B/C
- งานซับซ้อน 3-5 คน: โปรเจคใหญ่, งาน A/S

**OCEAN Preference:**
- High C: งานต้องการความละเอียด
- High E: งานต้องติดต่อคนมาก
- Low N: งานกดดัน ต้องใจเย็น
- High O: งานต้องการความคิดสร้างสรรค์
- High A: งานต้องประสานงานมาก

**Important:**
- เลือก rank ตาม deadline_days และความซับซ้อนของงาน อย่าเลือก A ทุกครั้ง
- เลือก Skills ที่เสริมกัน ไม่ใช่ซ้ำกัน

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม
"""


def generate_quest(prompt: str, deadline_days: int = 7) -> dict:
    """Generate quest details from natural language prompt using Gemini"""
    
    # Format available skills as string
    skills_str = ", ".join(ALL_SKILLS[:50])  # Limit to avoid token overflow
    
    # Create the full prompt
    full_prompt = QUEST_GENERATION_PROMPT.format(
        prompt=prompt,
        deadline_days=deadline_days,
        available_skills=skills_str
    )
    
    try:
        response = get_llm().invoke(full_prompt)
        content = response.content
        
        # Extract JSON from response
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        else:
            json_str = content.strip()
        
        quest_data = json.loads(json_str)
        
        # Validate and set defaults
        quest_data.setdefault("title", "New Quest")
        quest_data.setdefault("description", prompt)
        quest_data.setdefault("rank", "C")
        quest_data.setdefault("team_size", 3)  # AI recommends this
        quest_data.setdefault("required_skills", [])
        quest_data.setdefault("optional_skills", [])
        quest_data.setdefault("ocean_preference", {})
        
        # Validate rank
        if quest_data["rank"] not in ["D", "C", "B", "A", "S"]:
            quest_data["rank"] = "C"
        
        return quest_data
        
    except Exception as e:
        print(f"Quest generation error: {e}")
        # Return fallback quest
        return {
            "title": "Custom Quest",
            "description": prompt,
            "rank": "C",
            "required_skills": [],
            "optional_skills": [],
            "ocean_preference": {},
            "deadline_days": 7
        }


def calculate_match_score(user_skills: list, user_ocean: dict, quest: dict) -> dict:
    """
    Calculate how well a user matches a quest
    Uses Kemii's Golden Formula for OCEAN scoring
    """
    import statistics
    
    required_skills = json.loads(quest.required_skills) if isinstance(quest.required_skills, str) else quest.required_skills
    optional_skills = json.loads(quest.optional_skills) if isinstance(quest.optional_skills, str) else quest.optional_skills
    
    # Build user skill lookup
    user_skill_map = {s["name"]: s["level"] for s in user_skills}
    
    # ========================================
    # SKILL SCORE (0-60 คะแนน)
    # ========================================
    skill_points = 0
    max_skill_points = 0
    missing_skills = []
    skill_gaps = []
    
    for req in required_skills:
        name = req["name"]
        req_level = req["level"]
        max_skill_points += req_level * 10
        
        if name in user_skill_map:
            user_level = user_skill_map[name]
            if user_level >= req_level:
                skill_points += req_level * 10
            else:
                skill_points += user_level * 5
                skill_gaps.append({
                    "name": name,
                    "required": req_level,
                    "has": user_level
                })
        else:
            missing_skills.append(name)
    
    # Optional skills bonus
    optional_bonus = 0
    for opt in optional_skills:
        name = opt["name"]
        if name in user_skill_map:
            optional_bonus += 5
    optional_bonus = min(optional_bonus, 10)
    
    skill_score = (skill_points / max(max_skill_points, 1)) * 60 + optional_bonus
    skill_score = min(int(skill_score), 70)
    
    # ========================================
    # OCEAN SCORE - Kemii's Golden Formula (0-30 คะแนน)
    # ========================================
    # ดึงค่า OCEAN ของ User
    o = user_ocean.get("ocean_openness", 25)
    c = user_ocean.get("ocean_conscientiousness", 25)
    e = user_ocean.get("ocean_extraversion", 25)
    a = user_ocean.get("ocean_agreeableness", 25)
    n = user_ocean.get("ocean_neuroticism", 25)
    
    # Helper: Normalized (0-1) with inversion for scoring
    def normalize(val):
        return (val - 10) / 40.0  # 10-50 range -> 0-1
    
    # Kemii Score Components (ยิ่งน้อยยิ่งดี)
    # 1. Core traits: ยิ่ง C สูง, A สูง ยิ่งดี
    core_score = 1.5 * (1 - normalize(c)) + 1.5 * (1 - normalize(a))
    
    # 2. Style traits: E, O - ดีถ้าอยู่กลางๆ (ไม่สุดโต่ง)
    e_deviation = abs(normalize(e) - 0.5) * 2  # 0 ถ้าอยู่กลาง, 1 ถ้าสุด
    o_deviation = abs(normalize(o) - 0.5) * 2
    style_score = 1.0 * e_deviation + 1.0 * o_deviation
    
    # 3. Stress: N ยิ่งต่ำยิ่งดี
    stress_score = 1.0 * normalize(n)
    
    # 4. Toxic Penalty: ถ้า A ต่ำกว่าเกณฑ์ โดนโทษ
    tau = 0.75
    toxic_penalty = 2.0 * max(0, tau - normalize(a))
    
    # Kemii Total (0-8 ช่วง, ยิ่งน้อยยิ่งดี)
    kemii_total = core_score + style_score + stress_score + toxic_penalty
    
    # Convert to 0-30 score (ยิ่งมากยิ่งดี)
    # kemii_total range: ~0 (perfect) to ~8 (bad)
    ocean_score = max(0, int(30 - (kemii_total * 4)))
    ocean_score = min(ocean_score, 30)
    
    # ========================================
    # TOTAL SCORE
    # ========================================
    total_score = skill_score + ocean_score
    
    # Determine match level
    if total_score >= 80:
        match_level = "perfect"
    elif total_score >= 60:
        match_level = "good"
    elif total_score >= 40:
        match_level = "moderate"
    else:
        match_level = "risky"
    
    return {
        "skill_score": int(skill_score),
        "ocean_score": int(ocean_score),
        "total_score": int(total_score),
        "match_level": match_level,
        "missing_skills": missing_skills,
        "skill_gaps": skill_gaps
    }


def find_best_candidates(quest, users: list, count: int, current_members: list = None) -> list:
    """
    Find the best matching candidates using Dynamic Gap Scoring.
    Instead of scoring each person individually, we look at what skills
    the team already has and find candidates that FILL THE GAPS.
    """
    if current_members is None:
        current_members = []
    
    required_skills = json.loads(quest.required_skills) if isinstance(quest.required_skills, str) else quest.required_skills
    optional_skills = json.loads(quest.optional_skills) if isinstance(quest.optional_skills, str) else quest.optional_skills
    
    # 1. Build Team Skill Inventory (what skills the team already has)
    team_skills = {}
    for member in current_members:
        member_skills = json.loads(member.skills) if isinstance(member.skills, str) else (member.skills or [])
        for s in member_skills:
            skill_name = s.get("name", "")
            skill_level = s.get("level", 0)
            if skill_name not in team_skills or skill_level > team_skills[skill_name]:
                team_skills[skill_name] = skill_level
    
    # 2. Calculate Remaining Skill Gaps (what we still need)
    def calculate_skill_gaps():
        gaps = []
        for req in required_skills:
            existing_level = team_skills.get(req["name"], 0)
            gap = req["level"] - existing_level
            if gap > 0:
                gaps.append({"name": req["name"], "level_needed": req["level"], "gap": gap})
        return gaps
    
    remaining_gaps = calculate_skill_gaps()
    required_skill_names = {s["name"] for s in required_skills}
    optional_skill_names = {s["name"] for s in optional_skills}
    gap_skill_names = {g["name"] for g in remaining_gaps}
    
    # 3. Score each candidate based on how well they fill the GAPS
    candidates = []
    
    for user in users:
        # Skip if user is not available
        if not user.is_available:
            continue
        
        # Skip if already in team
        if any(m.id == user.id for m in current_members):
            continue
        
        # Get user's skills
        user_skills = json.loads(user.skills) if user.skills else []
        user_skill_map = {s["name"]: s["level"] for s in user_skills}
        
        # Calculate Gap Fill Score (0-70 points)
        gap_fill_points = 0
        max_gap_points = max(len(remaining_gaps) * 20, 1)  # Prevent div by zero
        matching_skills = []
        skills_that_fill_gaps = []
        
        for gap in remaining_gaps:
            if gap["name"] in user_skill_map:
                user_level = user_skill_map[gap["name"]]
                # User has this skill! Calculate how much of the gap they fill
                if user_level >= gap["level_needed"]:
                    # Fully fills the gap - full points!
                    gap_fill_points += 20
                    skills_that_fill_gaps.append({
                        "name": gap["name"], 
                        "level": user_level, 
                        "fills_gap": True,
                        "type": "gap_filler"
                    })
                else:
                    # Partially fills the gap
                    fill_ratio = user_level / gap["level_needed"]
                    gap_fill_points += int(15 * fill_ratio)
                    skills_that_fill_gaps.append({
                        "name": gap["name"], 
                        "level": user_level, 
                        "fills_gap": False,
                        "type": "partial"
                    })
        
        # Normalize gap fill score to 0-70
        skill_score = int((gap_fill_points / max_gap_points) * 70)
        skill_score = min(skill_score, 70)
        
        # Find matching skills (for display)
        for skill in user_skills:
            if skill["name"] in required_skill_names:
                matching_skills.append({"name": skill["name"], "level": skill["level"], "type": "required"})
            elif skill["name"] in optional_skill_names:
                matching_skills.append({"name": skill["name"], "level": skill["level"], "type": "optional"})
        
        # Optional skills bonus (if all gaps are filled, optional skills matter more)
        optional_bonus = 0
        for opt in optional_skills:
            if opt["name"] in user_skill_map:
                optional_bonus += 3
        optional_bonus = min(optional_bonus, 10)
        
        # OCEAN Score (0-20 points) - simplified version
        user_ocean = {
            "ocean_openness": user.ocean_openness or 25,
            "ocean_conscientiousness": user.ocean_conscientiousness or 25,
            "ocean_extraversion": user.ocean_extraversion or 25,
            "ocean_agreeableness": user.ocean_agreeableness or 25,
            "ocean_neuroticism": user.ocean_neuroticism or 25
        }
        
        # Simple OCEAN scoring based on quest preference
        ocean_pref = json.loads(quest.ocean_preference) if isinstance(quest.ocean_preference, str) else (quest.ocean_preference or {})
        ocean_score = 10  # Base score
        
        high_prefs = ocean_pref.get("high", [])
        low_prefs = ocean_pref.get("low", [])
        
        ocean_map = {"O": "ocean_openness", "C": "ocean_conscientiousness", "E": "ocean_extraversion", "A": "ocean_agreeableness", "N": "ocean_neuroticism"}
        
        for h in high_prefs:
            if h in ocean_map and user_ocean.get(ocean_map[h], 0) >= 30:
                ocean_score += 3
        for l in low_prefs:
            if l in ocean_map and user_ocean.get(ocean_map[l], 0) <= 20:
                ocean_score += 2
        
        ocean_score = min(ocean_score, 20)
        
        # Total score
        total_score = skill_score + optional_bonus + ocean_score
        
        # Determine match level
        if total_score >= 80:
            match_level = "เหมาะมาก"
        elif total_score >= 60:
            match_level = "เข้ากันดี"
        elif total_score >= 40:
            match_level = "พอได้"
        else:
            match_level = "ลองดู"
        
        # Missing skills (gaps this candidate doesn't fill)
        missing_skills = [g["name"] for g in remaining_gaps if g["name"] not in user_skill_map]
        
        candidates.append({
            "user_id": user.id,
            "name": user.name,
            "character_class": user.character_class,
            "level": user.level,
            "skills": user_skills,
            "matching_skills": matching_skills + skills_that_fill_gaps,
            "match_score": total_score,
            "skill_score": skill_score,
            "ocean_score": ocean_score,
            "match_level": match_level,
            "missing_skills": missing_skills,
            "fills_gaps": len(skills_that_fill_gaps)
        })
    
    # Sort by: 
    # 1. Number of gaps they fill (descending)
    # 2. Then by match score (descending)
    candidates.sort(key=lambda x: (x["fills_gaps"], x["match_score"]), reverse=True)
    
    # Return top N candidates
    return candidates[:count]

