from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime, timedelta
import models, schemas
from engines.scheduling_engine import calculate_priority_score
from engines.burnout_engine import analyze_workload

router = APIRouter(prefix="/api/planner", tags=["Intelligent Planner"])

@router.get("/daily", response_model=schemas.DailyPlannerResponse)
def get_daily_planner(db: Session = Depends(get_db)):
    today = datetime.utcnow()
    next_week = today + timedelta(days=7)
    
    # 1. Fetch upcoming active tasks
    db_tasks = db.query(models.Task).filter(
        models.Task.completed == False,
        models.Task.deadline >= today,
        models.Task.deadline <= next_week
    ).all()
    
    task_responses = [schemas.TaskResponse.model_validate(t) for t in db_tasks]
    
    # 2. Apply Scheduling Engine (Calculate Dynamic Priority)
    for task in task_responses:
        task.priority_score = calculate_priority_score(task, today)
        
    # 3. Sort by cognitive priority
    task_responses.sort(key=lambda x: x.priority_score, reverse=True)
    
    # 4. Apply Burnout Engine
    score, is_burnout, suggestions = analyze_workload(task_responses)
    
    return schemas.DailyPlannerResponse(
        date=today,
        workload_score=score,
        burnout_warning=is_burnout,
        tasks=task_responses,
        ai_suggestions=suggestions
    )