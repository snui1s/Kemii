from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import JSON, Column, Text

class User(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    
    character_class: str = Field(default="Novice") 
    level: int = Field(default=1)
    
    ocean_openness: int = Field(default=0)
    ocean_conscientiousness: int = Field(default=0)
    ocean_extraversion: int = Field(default=0)
    ocean_agreeableness: int = Field(default=0)
    ocean_neuroticism: int = Field(default=0)
    
    is_available: bool = Field(default=True)
    team_name: Optional[str] = Field(default=None)
    analysis_result: Optional[str] = Field(default=None)
    skills: Optional[str] = Field(default=None)  # JSON: [{"name": "Python", "level": 4}, ...]
    
    active_project_end_date: Optional[datetime] = Field(default=None)

class TeamLog(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    leader_id: int = Field(foreign_key="user.id")
    team_name: str
    strategy: str    
    reason: str
    members_snapshot: List[Dict[str, Any]] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="generated") 
    project_start_date: Optional[datetime] = Field(default=None)
    project_end_date: Optional[datetime] = Field(default=None)