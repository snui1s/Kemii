# models.py
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import JSON, Column

class User(SQLModel, table=True):
    __table_args__ = {"extend_existing": True} 
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    dominant_type: str
    animal: str
    score_d: int
    score_i: int
    score_s: int
    score_c: int
    team_name: Optional[str] = Field(default=None)
    analysis_result: Optional[str] = Field(default=None)
    is_available: bool = Field(default=True)
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
    status: str = Field(default="generated") # generated, confirmed, disbanded
    
    project_start_date: Optional[datetime] = Field(default=None)
    project_end_date: Optional[datetime] = Field(default=None)