from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: datetime
    priority: str = "medium"
    category: str = "task"
    completed: bool = False
    estimated_minutes: Optional[int] = 30

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    completed: Optional[bool] = None

class TaskResponse(TaskBase):
    id: str
    created_at: datetime
    priority_score: Optional[float] = 0.0  # Appended dynamically by engine

    class Config:
        from_attributes = True

class SmartCaptureRequest(BaseModel):
    text: str

class DailyPlannerResponse(BaseModel):
    date: datetime
    workload_score: int
    burnout_warning: bool
    tasks: List[TaskResponse]
    ai_suggestions: List[dict]