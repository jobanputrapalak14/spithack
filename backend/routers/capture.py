from fastapi import APIRouter
from schemas import SmartCaptureRequest, TaskBase
from engines.capture_engine import parse_smart_input
from datetime import datetime

router = APIRouter(prefix="/api/capture", tags=["Smart Capture"])

@router.post("/", response_model=TaskBase)
async def capture_input(req: SmartCaptureRequest):
    # Get the current time so the AI knows what "tomorrow" means
    current_time = datetime.utcnow()
    
    # Pass BOTH the text and the current_time to the AI engine
    parsed_data = await parse_smart_input(req.text, current_time)
    
    return TaskBase(**parsed_data)