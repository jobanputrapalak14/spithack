import os
from twilio.rest import Client
from database import SessionLocal
import models

# Use environment variables for security!
ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_NUMBER = os.getenv("TWILIO_NUMBER")
USER_PHONE = os.getenv("MY_PHONE_NUMBER")

# Initialize Twilio Client
client = Client(ACCOUNT_SID, AUTH_TOKEN)

def send_pending_task_reminder():
    db = SessionLocal()
    try:
        # ⚠️ FIXED: Changed status != "done" to completed == False
        pending_tasks = db.query(models.Task).filter(models.Task.completed == False).all()
        
        if not pending_tasks:
            print("No pending tasks. Skipping SMS.")
            return

        # Format the message beautifully
        task_list = "\n- ".join([t.title for t in pending_tasks])
        message_body = (
            f"Namaste Vedant! Just a reminder that you have pending tasks:\n"
            f"- {task_list}\n\n"
            f"If done, please update it on the app! 🚀"
        )

        # Send the SMS
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_NUMBER,
            to=USER_PHONE
        )
        print(f"✅ SMS Reminder sent via Twilio! Message SID: {message.sid}")
    
    except Exception as e:
        print(f"❌ Error sending SMS: {e}")
    finally:
        db.close()