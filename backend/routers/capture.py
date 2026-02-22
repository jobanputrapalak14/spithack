from fastapi import APIRouter, Form, UploadFile, File, Request
from typing import Optional, List
from schemas import TaskBase
from engines.capture_engine import parse_smart_input, transcribe_audio, extract_file_text
from datetime import datetime

router = APIRouter(prefix="/api/capture", tags=["Smart Capture"])

@router.post("/")
async def capture_input(request: Request):
    """
    Accepts text, audio, and file attachments via multipart form data.
    - Audio is transcribed via OpenAI Whisper and appended to the text.
    - File content is extracted (txt, pdf, etc.) and appended as context.
    - The combined text is sent to OpenAI for task parsing.
    """
    current_time = datetime.utcnow()
    combined_parts = []

    try:
        form = await request.form()
        print(f"📥 Capture received form keys: {list(form.keys())}")

        # 1. Start with user-typed text
        text = form.get("text", "")
        if text and str(text).strip():
            combined_parts.append(str(text).strip())

        # 2. Transcribe audio if provided
        audio = form.get("audio")
        if audio and hasattr(audio, 'read'):
            try:
                audio_bytes = await audio.read()
                filename = getattr(audio, 'filename', 'voice_recording.m4a')
                print(f"🎤 Audio received: {filename}, size: {len(audio_bytes)} bytes")
                if audio_bytes and len(audio_bytes) > 0:
                    transcription = await transcribe_audio(audio_bytes, filename)
                    if transcription:
                        combined_parts.append(f"[Voice input]: {transcription}")
                        print(f"🎤 Transcription: {transcription}")
            except Exception as e:
                print(f"⚠️ Audio processing error: {e}")

        # 3. Extract text from attached files
        # FormData can send multiple files under the same key "files"
        files_in_form = form.getlist("files") if hasattr(form, 'getlist') else []
        # Also check for single "files" entry
        if not files_in_form:
            single_file = form.get("files")
            if single_file and hasattr(single_file, 'read'):
                files_in_form = [single_file]

        for uploaded_file in files_in_form:
            if uploaded_file and hasattr(uploaded_file, 'read'):
                try:
                    file_bytes = await uploaded_file.read()
                    filename = getattr(uploaded_file, 'filename', 'unknown')
                    print(f"📎 File received: {filename}, size: {len(file_bytes)} bytes")
                    if file_bytes and len(file_bytes) > 0:
                        file_text = extract_file_text(file_bytes, filename)
                        if file_text:
                            combined_parts.append(f"[File: {filename}]: {file_text}")
                except Exception as e:
                    print(f"⚠️ File processing error: {e}")

        # Combine all inputs
        combined_text = "\n\n".join(combined_parts) if combined_parts else str(text)
        print(f"📝 Combined input length: {len(combined_text)} chars")

        if not combined_text.strip():
            return {"title": "Untitled Task", "deadline": (current_time).isoformat(), "category": "task", "priority": "medium"}

        # Pass combined text to the AI engine
        parsed_data = await parse_smart_input(combined_text, current_time)
        print(f"✅ Parsed result: {parsed_data}")

        # Ensure deadline is serializable
        if "deadline" in parsed_data and isinstance(parsed_data["deadline"], datetime):
            parsed_data["deadline"] = parsed_data["deadline"].isoformat()

        return parsed_data

    except Exception as e:
        print(f"❌ Capture endpoint error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "title": str(text) if 'text' in dir() else "Error parsing input",
            "deadline": current_time.isoformat(),
            "category": "task",
            "priority": "medium",
        }
