from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

class OceanSubmission(BaseModel):
    name: str
    openness: int
    conscientiousness: int
    extraversion: int
    agreeableness: int
    neuroticism: int

class UserProfile(BaseModel):
    id: int
    name: str
    character_class: str  
    level: int
    
    ocean_scores: Dict[str, int]  
    
    access_token: Optional[str] = None

class UserNameUpdate(BaseModel):
    name: str

class MatchRequest(BaseModel):
    user1_id: int
    user2_id: int

class TeamBuilderRequest(BaseModel):
    leader_id: int
    member_count: int
    strategy: str 

class ConfirmTeamRequest(BaseModel):
    log_id: Optional[int] = None 
    team_name: Optional[str] = None 
    member_ids: Optional[List[int]] = None 
    start_date: datetime 
    end_date: datetime

class TeamRecommendation(BaseModel):
    strategy: str
    team_name: str
    reason: str
    leader: Dict[str, Any]
    members: List[Dict[str, Any]]
    log_id: Optional[int] = None
    team_score: Optional[int] = None
    team_rating: Optional[str] = None

class ReviveRequest(BaseModel):
    start_date: datetime
    end_date: datetime

class SkillItem(BaseModel):
    name: str
    level: int  # 1-5

class UpdateSkillsRequest(BaseModel):
    skills: List[SkillItem]

# Quest schemas
class CreateQuestRequest(BaseModel):
    prompt: str  # Natural language description
    deadline_days: int = 7  # Number of days for the quest
    leader_id: int
    start_date: datetime
    deadline: datetime

class QuestSkill(BaseModel):
    name: str
    level: int

class QuestResponse(BaseModel):
    id: int
    title: str
    description: str
    rank: str
    required_skills: List[QuestSkill]
    optional_skills: List[QuestSkill]
    ocean_preference: Dict[str, Any]
    team_size: int
    leader_id: int
    leader_name: Optional[str] = None
    leader_class: Optional[str] = None
    status: str
    applicant_count: int = 0
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    created_at: datetime

class ApplyQuestRequest(BaseModel):
    user_id: int

class MatchScoreResponse(BaseModel):
    skill_score: int  # 0-100
    ocean_score: int  # 0-100
    total_score: int  # 0-100
    match_level: str  # "perfect", "good", "moderate", "risky"
    missing_skills: List[str]
    skill_gaps: List[Dict[str, Any]]  # {"name": "Python", "required": 4, "has": 2}

class UpdateStatusRequest(BaseModel):
    user_id: int
    status: str
