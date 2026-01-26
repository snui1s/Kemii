import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.config import get_llm

llm = get_llm()


async def analyze_user_profile(user):
    prompt = ChatPromptTemplate.from_template(
        """
        Role: You are a "Guild Strategist & Career Mentor" (Expert in HR Psychology & RPG Mechanics).
        Goal: Decode the user's OCEAN stats into a unique RPG Class Identity and professional advice.
        Tone: Professional, Empowering, and slightly Gamified (Thai Language).

        User: {name} (Class: {rpg_class})
        Stats: O={openness}, C={conscientiousness}, E={extraversion}, A={agreeableness}, N={neuroticism}

        **INTERPRETATION GUIDELINES (HR + RPG):**
        - High O + Low C = "Wild Mage" (Innovative but needs focus).
        - High E + High A = "Paladin of Unity" (Leader who connects people).
        - Low E + High C = "Shadow Sniper" (Quiet, deep focus, precise).
        - **General Rule**: Find their "Superpower" (Highest Stat) and "Kryptonite" (Lowest Stat).

        **OUTPUT RULES (Strictly Thai):**
        1. **class_title**: Cool Thai RPG Title (e.g., "เนโครแมนเซอร์จอมโปรเจกต์").
        2. **prophecy**: 3-4 sentences describing their work style as if reading a legend.
           - "คุณเปรียบเสมือนจอมเวทย์ผู้..." (Blend RPG metaphor with real work habits).
        3. **strengths**: 3 Key Professional Skills.
        4. **weaknesses**: 2 Areas for Growth (Constructive).
        5. **best_partner**: A Class that covers their blind spots.

        **JSON FORMAT ONLY:**
        {{
            "class_title": "...",
            "prophecy": "...",
            "strengths": ["...", "...", "..."],
            "weaknesses": ["...", "..."],
            "best_partner": "..."
        }}
    """
    )

    chain = prompt | llm | StrOutputParser()

    try:
        raw_res = await chain.ainvoke(
            {
                "name": user.name,
                "rpg_class": user.character_class,
                "openness": user.ocean_openness,
                "conscientiousness": user.ocean_conscientiousness,
                "extraversion": user.ocean_extraversion,
                "agreeableness": user.ocean_agreeableness,
                "neuroticism": user.ocean_neuroticism,
            }
        )

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
            "best_partner": "Unknown",
        }


async def analyze_match_synergy(u1, u2, s1, s2, final_score):
    match_prompt = ChatPromptTemplate.from_template(
        """
        Role: You are a "Guild Strategy Consultant" (Expert in Party Synergy & HR Dynamics).
        Goal: Analyze the chemistry between two members and predict their teamwork effectiveness.
        Tone: Epic, Constructive, and Insightful (Thai Language).

        **Party Members:**
        1. {name1} ({class1}) [Stats: O={o1}, C={c1}, E={e1}, A={a1}, N={n1}]
        2. {name2} ({class2}) [Stats: O={o2}, C={c2}, E={e2}, A={a2}, N={n2}]
        **Chemistry Score:** {score}%

        **ANALYSIS FRAMEWORK:**
        - **Mage (O)** = Vision/Innovation vs **Paladin (C)** = Structure/Discipline.
        - **Warrior (E)** = Action/Speed vs **Cleric (A)** = Harmony/Support.
        - **Rogue (N)** = Risk Aware/Detail vs **Mage (O)** = Optimistic/Big Picture.

        **TASK:**
        - Identify if they are "Complements" (Cover each other's weaknesses) or "Clashes" (Too similar or too conflicting).
        - **Speak like a Guild Master consulting on team formation.**

        **OUTPUT RULES (Strictly Thai):**
        1. **synergy_name**: Creative Duo Title (e.g., "คู่หูหยินหยาง", "กำแพงเหล็กและหอกสายฟ้า").
        2. **analysis**: 2-3 sentences blending RPG roles with work styles.
        3. **pro_tip**: One solid advice for them to work better together.

        **JSON FORMAT ONLY:**
        {{
          "synergy_score": {score},
          "synergy_name": "...",
          "analysis": "...",
          "pro_tip": "..."
        }}
    """
    )

    chain = match_prompt | llm | StrOutputParser()

    try:
        raw_result = await chain.ainvoke(
            {
                "name1": u1.name,
                "class1": u1.character_class,
                "o1": s1["O"],
                "c1": s1["C"],
                "e1": s1["E"],
                "a1": s1["A"],
                "n1": s1["N"],
                "name2": u2.name,
                "class2": u2.character_class,
                "o2": s2["O"],
                "c2": s2["C"],
                "e2": s2["E"],
                "a2": s2["A"],
                "n2": s2["N"],
                "score": final_score,
            }
        )

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


async def generate_team_overview(team_stats: dict) -> str:
    prompt = ChatPromptTemplate.from_template(
        """
        Role: You are a "Senior Party Tactician" (Expert in Organizational Psychology & RPG Mechanics).
        Goal: Analyze this team composition (Party) and explain how they will perform in a business quest.
        Tone: Professional, Insightful, yet Engaging (Thai Language).

        Team Stats:
        - Score: {score}/100
        - Openness: {avg_o}
        - Conscientiousness: {avg_c}
        - Extraversion: {avg_e}
        - Agreeableness: {avg_a}
        - Neuroticism: {avg_n}

        **ANALYSIS GUIDELINES:**
        1. **Team Spirit (Agreeableness)**: High = "Harmonious Guild", Low = "Debate Club".
        2. **Execution Power (Conscientiousness)**: High = "Disciplined Army", Low = "Adaptive Mercenaries".
        3. **Stability (Neuroticism)**: Low = "Rock-solid Morale", High = "High Alert / Sensitive".
        
        **INSTRUCTIONS:**
        - Summarize the team's "Vibe" in 2-3 sentences.
        - Highlight the Strongest trait as the team's "Superpower".
        - Mention one potential blind spot (e.g., "Great at ideas but might miss deadlines" if C is low).
        - Use "Team" or "Party" interchangeably.
        - **Speak like a tactician analyzing a battle formation, but for office work.**
        """
    )

    chain = prompt | llm | StrOutputParser()

    try:
        response = await chain.ainvoke(team_stats)
        return response.strip()
    except Exception as e:
        print(f"Team Analysis Error: {e}")
        return "ไม่สามารถประเมินผลทีมได้ในขณะนี้"
