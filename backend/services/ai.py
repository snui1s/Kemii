import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.config import get_llm

llm = get_llm()

async def analyze_user_profile(user):
    prompt = ChatPromptTemplate.from_template("""
        Role: You are the "Grand Guild Master". Analyze the adventurer {name} (Class: {rpg_class}) based on their OCEAN stats: O={openness}, C={conscientiousness}, E={extraversion}, A={agreeableness}, N={neuroticism}.

        Goal: Create a Thai Fantasy RPG profile that feels deeply personal ("This is literally me!").

        **ANALYSIS LOGIC (Analyze Stat Interactions):**
        Do not judge stats in isolation. Look for the interaction between the highest/lowest stats:
        1. The Conflict: High ambition (O) vs Low discipline (C) = "Inner Struggle".
        2. The Synergy: High Energy (E) + High Empathy (A) = "Ultimate Combo" (but maybe a people pleaser).
        3. The Extremes: If one stat is very high/low, make it their superpower and their curse.

        **OUTPUT RULES (Strictly Thai Language):**
        1. class_title: Creative Thai RPG class (e.g., "จอมเวทย์จอมปั่น").
        2. prophecy (3-4 sentences):
        - START IMMEDIATELY with "{name}" or "เจ้า".
        - NO prefixes (e.g., NO "คำทำนาย:", NO "บทวิเคราะห์:").
        - Describe their inner nature vs outer work style.
        3. strengths (3 items): Format as [RPG Metaphor] -> [Real Work Scenario]. (2 sentences max).
        4. weaknesses (2 items): Focus on the side effects of their unique stats.
        5. best_partner: "[Class Name] - [Reason]"

        **CONSTRAINTS:**
        - JSON FORMAT ONLY.
        - NO English text in values.
        - NO Markdown (no bold, no italics), NO bullet symbols in strings.

        **JSON TEMPLATE:**
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
        return ai_data

    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "class_title": f"{user.character_class} ฝึกหัด",
            "prophecy": "พลังของท่านยังคลุมเครือ... โปรดลองใหม่อีกครั้ง",
            "strengths": ["Unknown"],
            "weaknesses": ["Unknown"],
            "best_partner": "Unknown"
        }

async def analyze_match_synergy(u1, u2, s1, s2, final_score):
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
        return json.loads(cleaned_json)

    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "synergy_score": final_score,
            "synergy_name": "พันธสัญญาแห่งโชคชะตา",
            "analysis": "พลังเวทย์ผันผวน... ไม่สามารถอ่านคำทำนายได้ชัดเจน แต่ค่าพลังพื้นฐานบ่งบอกถึงความเป็นไปได้",
            "pro_tip": "ลองให้ทั้งคู่ลงดันเจี้ยนง่ายๆ ร่วมกันดูก่อน",
        }

async def generate_team_name(leader, member_names, final_score, team_rating, strategy):
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
            "strategy": strategy
        })

        res_json = json.loads(raw.replace("```json", "").replace("```", "").strip())
        team_name = res_json.get('team_name', f"ทีมของ {leader.name}")
        reason = res_json.get('reason', f"ทีมนี้มีคะแนนความเข้ากัน {final_score}% ({team_rating})")
        return team_name, reason

    except Exception as e:
        print(f"AI Naming Error: {e}")
        team_name = f"ทีมของ {leader.name}"
        reason = f"ทีมนี้ถูกคัดเลือกด้วย Headhunter Algorithm คะแนนความเข้ากัน {final_score}% ({team_rating})"
        return team_name, reason

# =========================
# Quest Generation Logic (Moved from quest_ai.py)
# =========================

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
    from data.skills import get_all_skills # Lazy import to avoid circular dependency
    ALL_SKILLS = get_all_skills()
    
    # Format available skills as string
    skills_str = ", ".join(ALL_SKILLS[:50])  # Limit to avoid token overflow
    
    # Create the full prompt
    full_prompt = QUEST_GENERATION_PROMPT.format(
        prompt=prompt,
        deadline_days=deadline_days,
        available_skills=skills_str
    )
    
    try:
        response = llm.invoke(full_prompt)
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
            "ocean_preference": {},
            "deadline_days": 7
        }

async def generate_team_overview(team_stats: dict) -> str:
    prompt = ChatPromptTemplate.from_template("""
    คุณเป็นระบบวิเคราะห์คุณภาพทีมจากบุคลิกภาพ Big Five (OCEAN)
    หน้าที่ของคุณคือสรุปภาพรวมของทีมในเชิงการทำงานร่วมกัน
    โดยเน้นจุดแข็งและความเหมาะสมของทีมในบริบทองค์กรธุรกิจ

    ข้อมูลทีม:
    - คะแนนเฉลี่ย: {score}/100
    - Openness: {avg_o}
    - Conscientiousness: {avg_c}
    - Extraversion: {avg_e}
    - Agreeableness: {avg_a}
    - Neuroticism: {avg_n}

    แนวทางการตอบ:
    - อธิบายภาพรวมของทีม ไม่ลงรายละเอียดรายบุคคล
    - ให้ความสำคัญกับ Conscientiousness, Agreeableness และ Neuroticism เป็นหลัก
    - หาก Conscientiousness หรือ Agreeableness เฉลี่ยอยู่ในระดับสูง ให้ชี้ว่าเป็นจุดแข็งของทีม
    - หาก Neuroticism เฉลี่ยอยู่ในระดับต่ำ ให้ชี้ว่าเป็นข้อดีด้านความมั่นคงทางอารมณ์
    - สามารถกล่าวถึง Extraversion หรือ Openness ได้หากช่วยเสริมภาพรวม
    - ห้ามกล่าวถึงสูตรคำนวณ คำว่า variance, cost function, normalize หรือ threshold
    - ใช้ภาษาทางการ กระชับ อ่านเข้าใจง่าย
    - ความยาว 2–4 ประโยค

    เป้าหมายคือทำให้ผู้อ่านเข้าใจว่าทีมนี้มีคุณภาพอย่างไร และเหมาะสมต่อการทำงานร่วมกันหรือไม่
    """)

    chain = prompt | llm | StrOutputParser()

    try:
        response = await chain.ainvoke(team_stats)
        return response.strip()
    except Exception as e:
        print(f"Team Analysis Error: {e}")
        return "ไม่สามารถประเมินผลทีมได้ในขณะนี้"
