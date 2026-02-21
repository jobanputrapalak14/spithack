import os
import json
import uuid
from typing import List, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from openai import AsyncOpenAI
from dotenv import load_dotenv

import models
from schemas import TaskResponse

# Load environment variables for OpenAI
load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def analyze_workload(tasks: List[TaskResponse], db: Session) -> Tuple[int, bool, List[dict]]:
    """
    1️⃣ Problem: Users burn out. Voice requests from the previous night need to be actioned.
    4️⃣ Core Logic: Weighted workload summation + OpenAI generation based on Voice Reflection.
    """
    score = 0
    high_tasks = []
    low_tasks = []
    
    # 1. Calculate base workload
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
    
    # 2. Add rule-based burnout suggestions if overwhelmed
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

    # 3. Read Voice Query from Last Night & Generate AI Suggestion
    latest_reflection = db.query(models.UserReflection).filter(
        models.UserReflection.used_in_suggestions == False
    ).order_by(models.UserReflection.date.desc()).first()

    if latest_reflection:
        voice_context = latest_reflection.transcribed_query
        
        system_prompt = f"""
        You are an AI planner for FocusFlow.
        Current daily workload score: {score} (Burnout threshold is 50).
        Last night on an automated phone call, the user requested the following for today: "{voice_context}"
        
        Generate 1 actionable scheduling suggestion addressing their voice request.
        Return ONLY a JSON object with:
        - "title": A short catchy title (string)
        - "description": A 1-sentence supportive explanation of how you adapted their schedule based on their call (string)
        """
        
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": system_prompt}],
                response_format={ "type": "json_object" },
                temperature=0.3
            )
            
            ai_data = json.loads(response.choices[0].message.content)
            
            suggestions.append({
                "id": str(uuid.uuid4()),
                "type": "voice_insight",
                "title": ai_data.get("title", "Based on your call last night"),
                "description": ai_data.get("description", "I have updated your suggestions."),
                "taskId": None,
                "changes": {}
            })
            
            # Mark the reflection as used so it doesn't show up again tomorrow
            latest_reflection.used_in_suggestions = True
            db.commit()
            
        except Exception as e:
            print(f"⚠️ Failed to generate voice suggestion: {e}")

    return score, burnout_warning, suggestions