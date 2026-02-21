from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import tasks, planner, capture, voice, google_services
import os
from twilio.rest import Client
from apscheduler.schedulers.background import BackgroundScheduler
from engines.reminders import send_pending_task_reminder

# 1. Create database tables
Base.metadata.create_all(bind=engine)

# 2. Initialize the App ONCE
app = FastAPI(
    title="FocusFlow AI System",
    description="Intelligent Life Management System Backend",
    version="1.0.0"
)

# 3. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Register Routers
app.include_router(capture.router)
app.include_router(tasks.router)
app.include_router(planner.router)
app.include_router(voice.router)
app.include_router(google_services.router)

# --- TWILIO & SCHEDULER LOGIC ---
scheduler = BackgroundScheduler()

def trigger_evening_call():
    """Fires at the scheduled time to call the user."""
    client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
    
    # NGROK_URL is required because Twilio needs a public URL to reach your localhost
    ngrok_url = os.getenv("NGROK_URL") 
    my_phone = os.getenv("MY_PHONE_NUMBER")
    
    call = client.calls.create(
        to=my_phone,
        from_=os.getenv("TWILIO_PHONE_NUMBER"),
        url=f"{ngrok_url}/api/voice/start",
        method="POST"
    )
    print(f"📞 Evening call dispatched! SID: {call.sid}")

@app.on_event("startup")
def start_scheduler():
    # For Hackathon Demo: Set this to trigger every 5 minutes so judges can see it!
    # In production: trigger='cron', hour=21, minute=0
    scheduler.add_job(trigger_evening_call, 'interval', minutes=5) 
    scheduler.start()

# --- NEW SECRET TEST ENDPOINT ---
@app.get("/api/test-call")
def test_call_now():
    """Secret endpoint to manually trigger the Twilio call for the hackathon demo!"""
    trigger_evening_call()
    return {"status": "success", "message": "Check your phone, it should be ringing!"}

# 5. Global Routes
@app.get("/")
def health_check():
    return {"status": "operational", "system": "FocusFlow Engine V1"}

@app.post("/api/capture/smart/")
async def smart_capture():
    print("HIT FASTAPI ENDPOINT")
    return {"status": "ok"}

# Initialize Scheduler
scheduler = BackgroundScheduler()

# Schedule to run every 6 hours (or use CronTrigger for specific times)
scheduler.add_job(send_pending_task_reminder, 'interval', hours=6)

@app.on_event("startup")
def start_scheduler():
    if not scheduler.running:
        scheduler.start()

@app.on_event("shutdown")
def stop_scheduler():
    scheduler.shutdown()