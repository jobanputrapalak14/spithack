from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

# Define the prefix here once. 
# In main.py, use: app.include_router(tasks.router) WITHOUT a prefix there.
router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.post("/", response_model=schemas.TaskResponse, status_code=201)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    """Creates a new task in the database."""
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/", response_model=List[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    """Fetches all tasks."""
    return db.query(models.Task).all()

@router.patch("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: str, updates: schemas.TaskUpdate, db: Session = Depends(get_db)):
    """Updates an existing task."""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
        
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task