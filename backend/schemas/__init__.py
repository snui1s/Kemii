from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    departments: List[str] = []

class OceanSubmission(BaseModel):
    name: Optional[str] = None
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

class UserPublic(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    role: str
    character_class: str
    level: int
    ocean_openness: int
    ocean_conscientiousness: int
    ocean_extraversion: int
    ocean_agreeableness: int
    ocean_neuroticism: int
    is_available: bool
    skills: Optional[str] = None
    active_project_end_date: Optional[datetime] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

class UserNameUpdate(BaseModel):
    name: str

class RoleUpdate(BaseModel):
    role: str # "user" or "admin"

class MatchRequest(BaseModel):
    user1_id: int
    user2_id: int

class TeamBuilderRequest(BaseModel):
    leader_id: int
    member_count: int
    strategy: str 

class ConfirmTeamRequest(BaseModel): 
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



class MatchScoreResponse(BaseModel):
    skill_score: int  # 0-100
    ocean_score: int  # 0-100
    total_score: int  # 0-100
    match_level: str  # "perfect", "good", "moderate", "risky"
    missing_skills: List[str]
    skill_gaps: List[Dict[str, Any]]  # {"name": "Python", "required": 4, "has": 2}

class UpdateStatusRequest(BaseModel):
    status: str
    user_id: int

# Smart Quest (Quest 2) Schemas
class SmartQuestRequirement(BaseModel):
    department_id: str
    count: int

class PreviewSmartTeamRequest(BaseModel):
    requirements: List[SmartQuestRequirement]
    candidate_ids: List[int]

class ConfirmSmartTeamRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    deadline: datetime
    start_date: datetime
    leader_id: int
    requirements: List[SmartQuestRequirement]
    member_ids: List[int]
    status: str

class AnalyzeTeamRequest(BaseModel):
    score: int
    avg_o: float
    avg_c: float
    avg_e: float
    avg_a: float
    avg_n: float
