from datetime import datetime
from schemas import TaskResponse

def calculate_priority_score(task: TaskResponse, current_time: datetime = None) -> float:
    """
    1️⃣ Problem: Flat lists don't convey cognitive priority.
    4️⃣ Core Logic: Priority Score = (W1 * Urgency) + (W2 * Importance)
    """
    if not current_time:
        current_time = datetime.utcnow()
        
    if not task.deadline:
        return 0.1 # Lowest priority for unscheduled items
        
    days_until = max(1, (task.deadline.date() - current_time.date()).days)
    urgency = 1.0 / days_until
    
    importance_map = {'high': 1.0, 'medium': 0.5, 'low': 0.2}
    importance = importance_map.get(task.priority, 0.5)
    
    return (0.6 * urgency) + (0.4 * importance)