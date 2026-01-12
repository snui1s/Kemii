from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import JSON, Column, Text
from ulid import ULID

class User(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: str = Field(default_factory=lambda: str(ULID()), primary_key=True)
    name: str
    email: Optional[str] = Field(default=None, sa_column_kwargs={"unique": True})
    hashed_password: Optional[str] = Field(default=None)
    role: str = Field(default="user") # user, admin
    
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
    skills: Optional[str] = Field(default=None) 
    
    active_project_end_date: Optional[datetime] = Field(default=None)

class Quest(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: str = Field(default_factory=lambda: str(ULID()), primary_key=True)
    title: str
    description: str = Field(sa_column=Column(Text))
    rank: str = Field(default="C")  # D, C, B, A, S
    required_skills: str = Field(default="[]")  # JSON: [{"name": "Python", "level": 3}]
    ocean_preference: str = Field(default="{}")  # JSON: {"C": "high", "N": "low"}
    team_size: int = Field(default=1)
    leader_id: str = Field(foreign_key="user.id")
    status: str = Field(default="open")  # open, in_progress, completed, cancelled
    accepted_members: str = Field(default="[]")  # JSON: [user_ids]
    start_date: Optional[datetime] = Field(default=None)
    deadline: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)