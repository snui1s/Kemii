import pytest
from services.matching import calculate_team_cost, cost_to_score, calculate_match_score
from models import User, Quest
import json

def make_user(name, o, c, e, a, n, skills=[]):
    return User(
        name=name,
        ocean_openness=o,
        ocean_conscientiousness=c,
        ocean_extraversion=e,
        ocean_agreeableness=a,
        ocean_neuroticism=n,
        skills=json.dumps(skills),
        character_class="Test Class",
        level=1
    )

def test_perfect_match_synergy():
    """Test that two identical users with good traits have low cost (high score)."""
    u1 = make_user("Good 1", 30, 50, 30, 50, 10)
    u2 = make_user("Good 2", 30, 50, 30, 50, 10)
    
    cost = calculate_team_cost([u1, u2])
    score = cost_to_score(cost)
    
    # Perfect match should have score > 90%
    assert score > 90
    assert cost < 0.2

def test_toxic_pair_synergy():
    """Test that users with bad traits (High N, Low A) have high cost (low score)."""
    u1 = make_user("Toxic 1", 30, 10, 30, 10, 50)
    u2 = make_user("Toxic 2", 30, 10, 30, 10, 50)
    
    cost = calculate_team_cost([u1, u2])
    score = cost_to_score(cost)
    
    # Toxic match should have low score (around 43-45%)
    assert score < 50
    assert cost > 1.0

def test_opposite_variance_synergy():
    """Test that extreme variance in traits increases cost."""
    u1 = make_user("Min Stats", 10, 10, 10, 10, 10)
    u2 = make_user("Max Stats", 50, 50, 50, 50, 50)
    
    cost = calculate_team_cost([u1, u2])
    score = cost_to_score(cost)
    
    # High variance should lead to a mediocre score even if means are average
    # Mean A = 30 (neutral), but Var(A) is huge.
    assert score < 70

def test_match_score_with_skills():
    """Test individual match score against a quest."""
    user_skills = [{"name": "Coding", "level": 5}]
    user_ocean = {
        "ocean_openness": 50,
        "ocean_conscientiousness": 50,
        "ocean_extraversion": 50,
        "ocean_agreeableness": 50,
        "ocean_neuroticism": 10
    }
    quest = Quest(
        title="Tech Quest",
        description="Need a coder",
        required_skills=json.dumps([{"name": "Coding", "level": 4}]),
        ocean_preference=json.dumps({"C": "high"})
    )
    
    result = calculate_match_score(user_skills, user_ocean, quest)
    
    # User has higher skill than required and good personality for the quest
    assert result["total_score"] > 80
    assert result["match_level"] == "perfect"

def test_match_score_missing_skills():
    """Test match score when user lacks required skills."""
    user_skills = []
    user_ocean = {
        "ocean_openness": 30,
        "ocean_conscientiousness": 30,
        "ocean_extraversion": 30,
        "ocean_agreeableness": 30,
        "ocean_neuroticism": 30
    }
    quest = Quest(
        title="Expert Quest",
        description="Need an expert",
        required_skills=json.dumps([{"name": "Archery", "level": 5}]),
        ocean_preference=json.dumps({"C": "high"})
    )
    
    result = calculate_match_score(user_skills, user_ocean, quest)
    
    # Score should be significantly lower due to missing skill
    assert result["total_score"] < 50
    assert result["match_level"] == "risky"
