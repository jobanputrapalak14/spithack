from typing import List, Tuple
from datetime import datetime, timedelta
from schemas import TaskResponse
import uuid

def analyze_workload(tasks: List[TaskResponse]) -> Tuple[int, bool, List[dict]]:
    """
    1️⃣ Problem: Users burn out when schedules lack bounded cognitive limits.
    4️⃣ Core Logic: Weighted summation of pending tasks against a threshold.
    """
    score = 0
    high_tasks = []
    low_tasks = []
    
    for t in tasks:
        if not t.completed:
            if t.priority == 'high':
                score += 15
                high_tasks.append(t)
            elif t.priority == 'medium':
                score += 10
            elif t.priority == 'low':
                score += 5
                low_tasks.append(t)
                
    # 50 is the cognitive threshold limit
    burnout_warning = score > 50
    suggestions = []
    
    if burnout_warning:
        if low_tasks:
            target = low_tasks[0]
            suggestions.append({
                "id": str(uuid.uuid4()),
                "type": "reschedule",
                "title": "Reschedule Low Priority Task",
                "description": f"Move '{target.title}' to next week to reduce current workload.",
                "taskId": target.id,
                "changes": {"deadline": (datetime.utcnow() + timedelta(days=7)).isoformat()}
            })
            
        if len(high_tasks) >= 2:
            suggestions.append({
                "id": str(uuid.uuid4()),
                "type": "prioritize",
                "title": "Focus on One Priority",
                "description": f"You have {len(high_tasks)} high-priority items. Focus strictly on '{high_tasks[0].title}' first.",
                "taskId": high_tasks[1].id,
                "changes": {"priority": "medium"}
            })

    return score, burnout_warning, suggestions