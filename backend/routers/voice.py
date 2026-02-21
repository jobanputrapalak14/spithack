from fastapi import APIRouter, Request, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database import get_db
import models
import os
from openai import AsyncOpenAI

router = APIRouter(prefix="/api/voice", tags=["Voice Agent"])
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Retrieve the public URL from environment variables
BASE_URL = os.getenv("NGROK_URL")

def generate_twiml(content: str):
    """Helper to wrap TwiML in clean XML with correct headers."""
    xml_output = f'<?xml version="1.0" encoding="UTF-8"?><Response>{content}</Response>'
    return Response(content=xml_output, media_type="application/xml")

@router.post("/start")
async def voice_start(request: Request, db: Session = Depends(get_db)):
    """A direct reminder call that lists tasks and captures one update."""
    
    # 1. Fetch incomplete tasks
    pending_tasks = db.query(models.Task).filter(
        models.Task.completed == False
    ).limit(3).all()
    
    # 2. Build the Reminder Script
    if not pending_tasks:
        script = "Namaste! This is Focus Flow. You have no pending tasks today. Excellent job! Do you have any quick notes for tomorrow?"
    else:
        task_names = ", ".join([t.title for t in pending_tasks])
        script = f"Namaste! This is your reminder. You still have {task_names} pending. Please update them in the app. Anything to add for tomorrow's plan?"

    # 3. Quick Gather (Trial friendly: short timeout)
    content = f"""
    <Gather input="speech" action="{BASE_URL}/api/voice/respond" method="POST" speechTimeout="3" language="en-IN">
        <Say voice="Polly.Aditi" language="en-IN">{script}</Say>
    </Gather>
    <Say voice="Polly.Aditi" language="en-IN">I didn't hear anything. Keeping your schedule as is. Goodnight!</Say>
    <Hangup/>
    """
    return generate_twiml(content)

@router.post("/respond")
async def voice_respond(request: Request, db: Session = Depends(get_db)):
    """One-shot response handler: saves the note and ends the call fast."""
    form_data = await request.form()
    user_speech = form_data.get("SpeechResult", "")
    
    if user_speech:
        print(f"🗣️ User Note Captured: {user_speech}")
        # Save to database for the Daily Planner to see
        reflection = models.UserReflection(transcribed_query=user_speech)
        db.add(reflection)
        db.commit()
        
        reply = "Got it, I've noted that down. Your schedule will be updated. Goodnight!"
    else:
        reply = "No updates received. Goodnight!"

    # End call immediately to avoid Trial timeouts
    content = f"""
    <Say voice="Polly.Aditi" language="en-IN">{reply}</Say>
    <Hangup/>
    """
    return generate_twiml(content)