from fastapi import APIRouter, Form, UploadFile, File
from typing import Optional, List
from schemas import TaskBase
from engines.capture_engine import parse_smart_input, transcribe_audio, extract_file_text
from datetime import datetime

router = APIRouter(prefix="/api/capture", tags=["Smart Capture"])

@router.post("/", response_model=TaskBase)
async def capture_input(
    text: str = Form(default=""),
    audio: Optional[UploadFile] = File(default=None),
    files: Optional[List[UploadFile]] = File(default=None),
):
    """
    Accepts text, audio, and file attachments via multipart form data.
    - Audio is transcribed via OpenAI Whisper and appended to the text.
    - File content is extracted (txt, pdf, etc.) and appended as context.
    - The combined text is sent to OpenAI for task parsing.
    """
    current_time = datetime.utcnow()
    combined_parts = []

    # 1. Start with user-typed text
    if text and text.strip():
        combined_parts.append(text.strip())

    # 2. Transcribe audio if provided
    if audio and audio.filename:
        audio_bytes = await audio.read()
        if audio_bytes:
            transcription = await transcribe_audio(audio_bytes, audio.filename)
            if transcription:
                combined_parts.append(f"[Voice input]: {transcription}")

    # 3. Extract text from attached files
    if files:
        for uploaded_file in files:
            if uploaded_file and uploaded_file.filename:
                file_bytes = await uploaded_file.read()
                if file_bytes:
                    file_text = extract_file_text(file_bytes, uploaded_file.filename)
                    if file_text:
                        combined_parts.append(f"[File: {uploaded_file.filename}]: {file_text}")

    # Combine all inputs
    combined_text = "\n\n".join(combined_parts) if combined_parts else text

    # Pass combined text to the AI engine
    parsed_data = await parse_smart_input(combined_text, current_time)

    return TaskBase(**parsed_data)