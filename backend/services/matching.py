from typing import List, Optional, Dict

# =========================
# Constants (Golden Formula)
# =========================
# Cost = 1.5 * Var(C) + 1.5 * Var(A) + 1.0 * Var(E) + 1.0 * Var(O) +
# 1.0 * Mean(N) + 2.0 * max(0, 0.625 - Mean(A))

TAU = 0.625
LAMBDA = 2.0
MIN_SCORE = 10
MAX_SCORE = 50
SCORE_RANGE = 40
VAR_MAX = 400

# Theoretical Upper Bound: 7.25
THEORETICAL_MAX_COST = 6 + LAMBDA * TAU

# Empirical Upper Bound: 4.0
SCALING_MAX_COST = 4.0


# =========================
# Helpers
# =========================
def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def mean(values):
    if not values:
        return 0.0
    return sum(values) / len(values)


def get_stats(u):
    return {
        "O": u.ocean_openness or 0,
        "C": u.ocean_conscientiousness or 0,
        "E": u.ocean_extraversion or 0,
        "A": u.ocean_agreeableness or 0,
        "N": u.ocean_neuroticism or 0,
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
    """Calculate the Kemii Golden Formula Cost."""
    if not users or len(users) < 2:
        return 0.0

    traits = {"O": [], "C": [], "E": [], "A": [], "N": []}

    for u in users:
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
        1.5 * var_star(traits["C"])
        + 1.5 * var_star(traits["A"])
        + 1.0 * var_star(traits["E"])
        + 1.0 * var_star(traits["O"])
        + 1.0 * xbar_star(traits["N"])
        + LAMBDA * max(0.0, TAU - xbar_star(traits["A"]))
    )

    return cost


def cost_to_score(cost: float) -> float:
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
    cost = calculate_team_cost(users)

    if cost == float("inf"):
        return {"cost": float("inf"), "score": 0.0, "rating": "Invalid Data"}

    score = cost_to_score(cost)
    rating = get_team_rating(score)

    return {"cost": round(cost, 3), "score": score, "rating": rating}


def calculate_academic_cost(team_stats_list):
    """Adapter for legacy dict inputs."""

    class MockUser:
        def __init__(self, s):
            self.ocean_openness = s.get("O")
            self.ocean_conscientiousness = s.get("C")
            self.ocean_extraversion = s.get("E")
            self.ocean_agreeableness = s.get("A")
            self.ocean_neuroticism = s.get("N")

    users = [MockUser(s) for s in team_stats_list]
    return calculate_team_cost(users)


import json


def calculate_match_score(user_skills: list, user_ocean: dict, quest) -> dict:
    """Calculate how well a user matches a quest (Skill + OCEAN)."""
    # Parse Quest Requirements
    if isinstance(quest, dict):
        rq_field = quest.get("required_skills", "[]")
        qs_prefs = quest.get("ocean_preference", "{}")
    else:
        rq_field = quest.required_skills
        qs_prefs = quest.ocean_preference

    required_skills = json.loads(rq_field) if isinstance(rq_field, str) else rq_field

    user_skill_map = {s["name"]: s["level"] for s in user_skills}

    # 1. SKILL SCORE (0-60)
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
                skill_gaps.append(
                    {"name": name, "required": req_level, "has": user_level}
                )
        else:
            missing_skills.append(name)

    skill_score = (skill_points / max(max_skill_points, 1)) * 60
    skill_score = min(int(skill_score), 70)
    skill_score = min(int(skill_score), 70)

    # 2. OCEAN SCORE (0-30)
    o = user_ocean.get("ocean_openness", 25)
    c = user_ocean.get("ocean_conscientiousness", 25)
    e = user_ocean.get("ocean_extraversion", 25)
    a = user_ocean.get("ocean_agreeableness", 25)
    n = user_ocean.get("ocean_neuroticism", 25)

    def normalize(val):
        return (val - 10) / 40.0

    core_score = 1.5 * (1 - normalize(c)) + 1.5 * (1 - normalize(a))

    e_deviation = abs(normalize(e) - 0.5) * 2
    o_deviation = abs(normalize(o) - 0.5) * 2
    style_score = 1.0 * e_deviation + 1.0 * o_deviation

    stress_score = 1.0 * normalize(n)

    tau = 0.6
    toxic_penalty = 2.0 * max(0, tau - normalize(a))

    kemii_total = core_score + style_score + stress_score + toxic_penalty

    ocean_score = max(0, int(30 - (kemii_total * 4)))
    ocean_score = min(ocean_score, 30)

    # 3. TOTAL SCORE
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
        "skill_gaps": skill_gaps,
    }


def generate_top_teams_iterative(head_user, req_pools, top_n=5) -> list:
    """
    Generate multiple team combinations by iteratively adding members
    that match the evolving team centroid, starting from a Head user.
    """
    import copy

    # Total team size needed including the head
    total_slots = sum(p["count"] for p in req_pools)

    # Initialize with just the head
    initial_team = [{"user": head_user, "role": "HEAD"}]

    # We will maintain a list of partial teams (paths)
    # Each path is a dict: {"members": list, "remaining_reqs": list_of_dicts}

    # Flatten requirements into a list of single slots to fill
    slots_to_fill = []
    for p in req_pools:
        for _ in range(p["count"]):
            slots_to_fill.append({"dept_id": p["dept_id"], "pool": p["pool"]})

    paths = [{"members": initial_team, "remaining": slots_to_fill}]

    # Iteratively fill slots
    # At each step, we expand all current paths by trying the best candidates for the next slot
    BRANCH_FACTOR = (
        4  # Number of candidates to consider per slot per path to create variations
    )

    while paths and paths[0]["remaining"]:
        new_paths = []
        for path in paths:
            current_members = path["members"]
            remaining = path["remaining"]

            # The next slot to fill
            next_slot = remaining[0]
            role = next_slot["dept_id"]
            pool = next_slot["pool"]

            # Filter pool to remove users already in this path
            used_ids = {m["user"].id for m in current_members}
            available = [u for u in pool if u.id not in used_ids]

            if not available:
                continue  # Dead end, cannot fill this slot

            # Score each available candidate against the current team
            candidate_scores = []
            for candidate in available:
                # Calculate what the cost WOULD be if we added this candidate
                test_users = [m["user"] for m in current_members] + [candidate]
                cost = calculate_team_cost(test_users)
                candidate_scores.append((cost, candidate))

            # Sort candidates by cost (lower is better harmony)
            candidate_scores.sort(key=lambda x: x[0])

            # Take top BRANCH_FACTOR candidates to create new paths
            top_candidates = candidate_scores[:BRANCH_FACTOR]

            for cost, candidate in top_candidates:
                new_members = list(current_members)
                new_members.append({"user": candidate, "role": role})
                new_remaining = remaining[1:]  # Consume the slot
                new_paths.append(
                    {
                        "members": new_members,
                        "remaining": new_remaining,
                        "latest_cost": cost,
                    }
                )

        # Keep only the top N * 2 paths at each step to prevent explosion
        new_paths.sort(key=lambda x: x.get("latest_cost", float("inf")))
        paths = new_paths[: top_n * 2]

    # Finalize teams
    final_teams = []
    team_signatures = (
        set()
    )  # To prevent exact duplicates if reached via different ordering

    for idx, path in enumerate(paths):
        if path["remaining"]:
            continue  # Incomplete team

        team_members = path["members"]
        users = [m["user"] for m in team_members]
        cost = calculate_team_cost(users)

        # Create a unique signature for this team (sorted IDs)
        sig = tuple(sorted([u.id for u in users]))
        if sig in team_signatures:
            continue

        team_signatures.add(sig)

        score = cost_to_score(cost)

        final_teams.append(
            {
                "id": f"opt-{idx+1}-{int(score)}",
                "team": team_members,
                "harmony_score": score,
                "raw_kemii_score": cost,
            }
        )

    # Sort final teams by score descending
    final_teams.sort(key=lambda x: x["harmony_score"], reverse=True)
    return final_teams[:top_n]


# Unused function: Not currently connected to any frontend feature
# def find_best_candidates(quest, users: list, count: int, current_members: list = None) -> list:
#     """Find the best matching candidates using Dynamic Gap Scoring."""
#     if current_members is None:
#         current_members = []
#
#     if isinstance(quest, dict):
#         rq_field = quest.get("required_skills", "[]")
#         qs_prefs = quest.get("ocean_preference", "{}")
#     else:
#         rq_field = quest.required_skills
#         qs_prefs = quest.ocean_preference

#     required_skills = json.loads(rq_field) if isinstance(rq_field, str) else rq_field
#     ocean_pref = json.loads(qs_prefs) if isinstance(qs_prefs, str) else (qs_prefs or {})

#     # 1. Build Team Skill Inventory
#     team_skills = {}
#     for member in current_members:
#         member_skills = json.loads(member.skills) if isinstance(member.skills, str) else (member.skills or [])
#         for s in member_skills:
#             skill_name = s.get("name", "")
#             skill_level = s.get("level", 0)
#             if skill_name not in team_skills or skill_level > team_skills[skill_name]:
#                 team_skills[skill_name] = skill_level
#
#     # 2. Calculate Remaining Skill Gaps
#     remaining_gaps = []
#     for req in required_skills:
#         existing_level = team_skills.get(req["name"], 0)
#         gap = req["level"] - existing_level
#         if gap > 0:
#             remaining_gaps.append({"name": req["name"], "level_needed": req["level"], "gap": gap})
#
#     required_skill_names = {s["name"] for s in required_skills}
#
#     # 3. Score candidates
#     candidates = []
#
#     for user in users:
#         if not user.is_available: continue
#         if any(m.id == user.id for m in current_members): continue
#
#         user_skills = json.loads(user.skills) if user.skills else []
#         user_skill_map = {s["name"]: s["level"] for s in user_skills}
#
#         # Skill Gap Score
#         gap_fill_points = 0
#         max_gap_points = max(len(remaining_gaps) * 20, 1)
#         matching_skills = []
#         skills_that_fill_gaps = []
#
#         for gap in remaining_gaps:
#             if gap["name"] in user_skill_map:
#                 user_level = user_skill_map[gap["name"]]
#                 if user_level >= gap["level_needed"]:
#                     gap_fill_points += 20
#                     skills_that_fill_gaps.append({
#                         "name": gap["name"], "level": user_level, "fills_gap": True, "type": "gap_filler"
#                     })
#                 else:
#                     ratio = user_level / gap["level_needed"]
#                     gap_fill_points += int(15 * ratio)
#                     skills_that_fill_gaps.append({
#                         "name": gap["name"], "level": user_level, "fills_gap": False, "type": "partial"
#                     })
#
#         skill_score = int((gap_fill_points / max_gap_points) * 70)
#         skill_score = min(skill_score, 70)
#
#         for skill in user_skills:
#             if skill["name"] in required_skill_names:
#                 matching_skills.append({"name": skill["name"], "level": skill["level"], "type": "required"})
#
#         # OCEAN Score (Simple Preference Match)
#         user_ocean = {
#             "O": user.ocean_openness or 25,
#             "C": user.ocean_conscientiousness or 25,
#             "E": user.ocean_extraversion or 25,
#             "A": user.ocean_agreeableness or 25,
#             "N": user.ocean_neuroticism or 25
#         }
#         oc_score = 10
#         high_prefs = ocean_pref.get("high", [])
#         low_prefs = ocean_pref.get("low", [])
#
#         ocean_map = {"O": "O", "C": "C", "E": "E", "A": "A", "N": "N"} # Map shorthand to key in simple dict
#
#         for h in high_prefs:
#             if h in ocean_map and user_ocean.get(ocean_map[h], 0) >= 30:
#                 oc_score += 3
#         for l in low_prefs:
#             if l in ocean_map and user_ocean.get(ocean_map[l], 0) <= 20:
#                 oc_score += 2
#         oc_score = min(oc_score, 20)
#
#         total_score = skill_score + oc_score
#
#         if total_score >= 80: match_level = "เหมาะมาก"
#         elif total_score >= 60: match_level = "เข้ากันดี"
#         elif total_score >= 40: match_level = "พอได้"
#         else: match_level = "ลองดู"
#
#         missing = [g["name"] for g in remaining_gaps if g["name"] not in user_skill_map]
#
#         candidates.append({
#             "user_id": user.id,
#             "name": user.name,
#             "character_class": user.character_class,
#             "level": user.level,
#             "skills": user_skills,
#             "matching_skills": matching_skills + skills_that_fill_gaps,
#             "match_score": total_score,
#             "skill_score": skill_score,
#             "ocean_score": oc_score,
#             "match_level": match_level,
#             "missing_skills": missing,
#             "fills_gaps": len(skills_that_fill_gaps)
#         })
#
#     candidates.sort(key=lambda x: (x["fills_gaps"], x["match_score"]), reverse=True)
#     return candidates[:count]
