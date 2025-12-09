# schemas.py
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class Answer(BaseModel):
    question_id: int
    most_value: str
    least_value: str     

class UserSubmission(BaseModel):
    name: str
    answers: List[Answer]

class UserResult(BaseModel):
    id: int
    name: str
    dominant_type: str
    animal: str
    scores: Dict[str, int]
    team_name: Optional[str]
    is_available: bool

class MatchRequest(BaseModel):
    user1_id: int
    user2_id: int
    
class GroupingRequest(BaseModel):
    num_teams: int
    
class UserNameUpdate(BaseModel):
    name: str
    
class TeamBuilderRequest(BaseModel):
    leader_id: int
    member_count: int
    strategy: str

class ConfirmTeamRequest(BaseModel):
    log_id: int
    start_date: Optional[datetime] = None 
    end_date: Optional[datetime] = None