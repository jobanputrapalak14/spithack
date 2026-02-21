from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer
from database import Base
import uuid
from datetime import datetime

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    priority = Column(String, default="medium") # high, medium, low
    category = Column(String, default="task")   # task, assignment, habit
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Store calculated metrics (optional, can also be strictly calculated at runtime)
    estimated_minutes = Column(Integer, default=30)