from pydantic import BaseModel
from typing import Optional, Dict, List

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
    
    is_assessed: bool
    access_token: Optional[str] = None

class UserNameUpdate(BaseModel):
    name: str

class MatchRequest(BaseModel):
    user1_id: int
    user2_id: int