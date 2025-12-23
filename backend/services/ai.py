import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.config import get_llm

llm = get_llm()

async def analyze_user_profile(user):
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
