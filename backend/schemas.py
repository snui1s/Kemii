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

class ReviveRequest(BaseModel):
    start_date: datetime
    end_date: datetime