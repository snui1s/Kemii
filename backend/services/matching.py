from typing import List, Optional, Dict
# Session, select, math, statistics removed (Unused)

# =========================
# Constants (Golden Formula)
# =========================
TAU = 0.625
LAMBDA = 2.0
MIN_SCORE = 10
MAX_SCORE = 50
SCORE_RANGE = 40
VAR_MAX = 400

# Theoretical Upper Bound (Absolute worst case: Max Variance + Max Penalty)
# = 1.5(1) + 1.5(1) + 1.0(1) + 1.0(1) + 1.0(1) + LAMBDA * TAU
# = 6.0 + 1.25 = 7.25
THEORETICAL_MAX_COST = 6 + LAMBDA * TAU 

# Empirical Upper Bound (For realistic grading calibration)
# Real-world teams rarely exceed variance of 0.5 or receive full penalty simultaneously.
# We map 0 - > 4.0 cost to 100 -> 0 score to utilize the full 0-100 scale effectively.
SCALING_MAX_COST = 4.0

# =========================
# Helpers
# =========================
def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))

def mean(values):
    if not values: return 0.0
    return sum(values) / len(values)

def get_stats(u):
    """Legacy helper for teams.py"""
    return {
        "O": u.ocean_openness or 0,
        "C": u.ocean_conscientiousness or 0,
        "E": u.ocean_extraversion or 0,
        "A": u.ocean_agreeableness or 0,
        "N": u.ocean_neuroticism or 0
    }



def variance(values):
    if len(values) <= 1:
        return 0.0
    mu = mean(values)
    return sum((x - mu) ** 2 for x in values) / len(values)

def var_star(values):
    return clamp01(variance(values) / VAR_MAX)

def xbar_star(values):
    return clamp01((mean(values) - MIN_SCORE) / SCORE_RANGE)

# =========================
# Core Logic
# =========================
def calculate_team_cost(users) -> float:
    """
    Calculate the Kemii Golden Formula Cost.
    Returns float('inf') if data is invalid or missing.
    users: List of objects having ocean_* attributes.
    """
    if not users or len(users) < 2:
        return 0.0

    traits = {"O": [], "C": [], "E": [], "A": [], "N": []}

    for u in users:
        # Strict validation: Reject if any OCEAN trait is missing
        if None in (
            u.ocean_openness,
            u.ocean_conscientiousness,
            u.ocean_extraversion,
            u.ocean_agreeableness,
            u.ocean_neuroticism,
        ):
            return float("inf")

        traits["O"].append(u.ocean_openness)
        traits["C"].append(u.ocean_conscientiousness)
        traits["E"].append(u.ocean_extraversion)
        traits["A"].append(u.ocean_agreeableness)
        traits["N"].append(u.ocean_neuroticism)

    cost = (
        1.5 * var_star(traits["C"]) +
        1.5 * var_star(traits["A"]) +
        1.0 * var_star(traits["E"]) +
        1.0 * var_star(traits["O"]) +
        1.0 * xbar_star(traits["N"]) +
        LAMBDA * max(0.0, TAU - xbar_star(traits["A"]))
    )

    return cost

def cost_to_score(cost: float) -> float:
    # Use SCALING_MAX_COST to calibrate score distribution
    score = 100 * (1 - cost / SCALING_MAX_COST)
    return round(clamp01(score / 100) * 100, 1)

def get_team_rating(s):
    if s >= 85:
        return "Excellent"
    elif s >= 70:
        return "Good"
    elif s >= 55:
        return "Acceptable"
    elif s >= 40:
        return "Risky"
    else:
        return "Not Recommended"

def evaluate_team(users):
    """
    Wrapper for full team evaluation (Cost + Score + Rating)
    """
    cost = calculate_team_cost(users)
    
    if cost == float('inf'):
        return {
            "cost": float("inf"),
            "score": 0.0,
            "rating": "Invalid Data"
        }

    score = cost_to_score(cost)
    rating = get_team_rating(score)

    return {
        "cost": round(cost, 3),
        "score": score,
        "rating": rating
    }

# Legacy Adapter
def calculate_academic_cost(team_stats_list):
    # Map dictionary inputs to objects for compatibility if needed, 
    # but strictly we should move callers to pass user objects.
    # For now, let's just warn or adapt.
    class MockUser:
        def __init__(self, s):
            self.ocean_openness = s.get("O")
            self.ocean_conscientiousness = s.get("C")
            self.ocean_extraversion = s.get("E")
            self.ocean_agreeableness = s.get("A")
            self.ocean_neuroticism = s.get("N")
    
    users = [MockUser(s) for s in team_stats_list]
    return calculate_team_cost(users)

def calculate_team_score_from_cost(cost):
    return cost_to_score(cost)

# Alias for backward compatibility
def calculate_team_score(cost):
    return cost_to_score(cost)


import json

def calculate_match_score(user_skills: list, user_ocean: dict, quest) -> dict:
    """
    Calculate how well a user matches a quest
    Uses Kemii's Golden Formula logic for OCEAN scoring component
    """
    # Parse Quest Requirements
    if isinstance(quest, dict):
        rq_field = quest.get("required_skills", "[]")
        qs_prefs = quest.get("ocean_preference", "{}")
    else:
        # SQLModel object
        rq_field = quest.required_skills
        qs_prefs = quest.ocean_preference

    required_skills = json.loads(rq_field) if isinstance(rq_field, str) else rq_field
    
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
    
    # Optional skills bonus removed (deprecated)
    
    skill_score = (skill_points / max(max_skill_points, 1)) * 60
    skill_score = min(int(skill_score), 70)
    skill_score = min(int(skill_score), 70)
    
    # ========================================
    # OCEAN SCORE - Kemii's Logic (0-30 คะแนน)
    # ========================================
    o = user_ocean.get("ocean_openness", 25)
    c = user_ocean.get("ocean_conscientiousness", 25)
    e = user_ocean.get("ocean_extraversion", 25)
    a = user_ocean.get("ocean_agreeableness", 25)
    n = user_ocean.get("ocean_neuroticism", 25)
    
    # Internal Normalize (0-1) for scoring components
    def normalize(val):
        return (val - 10) / 40.0

    # 1. Core traits: High C, High A is better
    core_score = 1.5 * (1 - normalize(c)) + 1.5 * (1 - normalize(a))
    
    # 2. Style: E, O - Balanced is better (deviation from 0.5 is bad)
    e_deviation = abs(normalize(e) - 0.5) * 2
    o_deviation = abs(normalize(o) - 0.5) * 2
    style_score = 1.0 * e_deviation + 1.0 * o_deviation
    
    # 3. Stress: High N is bad
    stress_score = 1.0 * normalize(n)
    
    # 4. Toxic Penalty: Low A
    tau = 0.6
    toxic_penalty = 2.0 * max(0, tau - normalize(a))
    
    # Total "Badness" (Lower is better)
    kemii_total = core_score + style_score + stress_score + toxic_penalty
    
    # Convert to 0-30 score (Higher is better)
    ocean_score = max(0, int(30 - (kemii_total * 4)))
    ocean_score = min(ocean_score, 30)
    
    # ========================================
    # TOTAL SCORE
    # ========================================
    total_score = skill_score + ocean_score
    
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
    """
    if current_members is None:
        current_members = []
    
    # Parsing
    # Parsing
    if isinstance(quest, dict):
        rq_field = quest.get("required_skills", "[]")
        qs_prefs = quest.get("ocean_preference", "{}")
    else:
        rq_field = quest.required_skills
        qs_prefs = quest.ocean_preference

    required_skills = json.loads(rq_field) if isinstance(rq_field, str) else rq_field
    ocean_pref = json.loads(qs_prefs) if isinstance(qs_prefs, str) else (qs_prefs or {})

    # 1. Build Team Skill Inventory
    team_skills = {}
    for member in current_members:
        member_skills = json.loads(member.skills) if isinstance(member.skills, str) else (member.skills or [])
        for s in member_skills:
            skill_name = s.get("name", "")
            skill_level = s.get("level", 0)
            if skill_name not in team_skills or skill_level > team_skills[skill_name]:
                team_skills[skill_name] = skill_level
    
    # 2. Calculate Remaining Skill Gaps
    remaining_gaps = []
    for req in required_skills:
        existing_level = team_skills.get(req["name"], 0)
        gap = req["level"] - existing_level
        if gap > 0:
            remaining_gaps.append({"name": req["name"], "level_needed": req["level"], "gap": gap})
    
    required_skill_names = {s["name"] for s in required_skills}
    
    # 3. Score candidates
    candidates = []
    
    for user in users:
        if not user.is_available: continue
        if any(m.id == user.id for m in current_members): continue
        
        user_skills = json.loads(user.skills) if user.skills else []
        user_skill_map = {s["name"]: s["level"] for s in user_skills}
        
        # Skill Gap Score
        gap_fill_points = 0
        max_gap_points = max(len(remaining_gaps) * 20, 1)
        matching_skills = []
        skills_that_fill_gaps = []
        
        for gap in remaining_gaps:
            if gap["name"] in user_skill_map:
                user_level = user_skill_map[gap["name"]]
                if user_level >= gap["level_needed"]:
                    gap_fill_points += 20
                    skills_that_fill_gaps.append({
                        "name": gap["name"], "level": user_level, "fills_gap": True, "type": "gap_filler"
                    })
                else:
                    ratio = user_level / gap["level_needed"]
                    gap_fill_points += int(15 * ratio)
                    skills_that_fill_gaps.append({
                        "name": gap["name"], "level": user_level, "fills_gap": False, "type": "partial"
                    })
        
        skill_score = int((gap_fill_points / max_gap_points) * 70)
        skill_score = min(skill_score, 70)
        
        # Display matching skills
        for skill in user_skills:
            if skill["name"] in required_skill_names:
                matching_skills.append({"name": skill["name"], "level": skill["level"], "type": "required"})
        
        # Optional Bonus removed

        
        # OCEAN Score (Simple Preference Match)
        user_ocean = {
            "O": user.ocean_openness or 25,
            "C": user.ocean_conscientiousness or 25,
            "E": user.ocean_extraversion or 25,
            "A": user.ocean_agreeableness or 25,
            "N": user.ocean_neuroticism or 25
        }
        oc_score = 10
        high_prefs = ocean_pref.get("high", [])
        low_prefs = ocean_pref.get("low", [])
        
        ocean_map = {"O": "O", "C": "C", "E": "E", "A": "A", "N": "N"} # Map shorthand to key in simple dict
        
        for h in high_prefs:
            if h in ocean_map and user_ocean.get(ocean_map[h], 0) >= 30:
                oc_score += 3
        for l in low_prefs:
            if l in ocean_map and user_ocean.get(ocean_map[l], 0) <= 20:
                oc_score += 2
        oc_score = min(oc_score, 20)
        
        total_score = skill_score + oc_score
        
        if total_score >= 80: match_level = "เหมาะมาก"
        elif total_score >= 60: match_level = "เข้ากันดี"
        elif total_score >= 40: match_level = "พอได้"
        else: match_level = "ลองดู"
        
        missing = [g["name"] for g in remaining_gaps if g["name"] not in user_skill_map]
        
        candidates.append({
            "user_id": user.id,
            "name": user.name,
            "character_class": user.character_class,
            "level": user.level,
            "skills": user_skills,
            "matching_skills": matching_skills + skills_that_fill_gaps,
            "match_score": total_score,
            "skill_score": skill_score,
            "ocean_score": oc_score,
            "match_level": match_level,
            "missing_skills": missing,
            "fills_gaps": len(skills_that_fill_gaps)
        })
        
    # Sort
    candidates.sort(key=lambda x: (x["fills_gaps"], x["match_score"]), reverse=True)
    return candidates[:count]
