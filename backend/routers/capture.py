import base64
from fastapi import APIRouter, Request
from starlette.datastructures import UploadFile as StarletteUploadFile
from engines.capture_engine import (
    parse_smart_input, transcribe_audio, extract_file_text,
    extract_image_text, is_image_file, generate_audio_response,
)
from datetime import datetime

router = APIRouter(prefix="/api/capture", tags=["Smart Capture"])


@router.post("/")
async def capture_text(request: Request):
    """TEXT MODE: Accepts text via form or JSON."""
    current_time = datetime.utcnow()
    try:
        content_type = request.headers.get("content-type", "")
        if "json" in content_type:
            body = await request.json()
            text = str(body.get("text", "")).strip()
        else:
            form = await request.form()
            text = str(form.get("text", "")).strip()

        print(f"📥 Text capture: '{text[:100]}'")
        if not text:
            return _empty_task(current_time)

        parsed_data = await parse_smart_input(text, current_time)
        _serialize_deadline(parsed_data)
        parsed_data["input_mode"] = "text"
        print(f"✅ Text parsed: {parsed_data}")
        return parsed_data
    except Exception as e:
        print(f"❌ Text capture error: {e}")
        import traceback; traceback.print_exc()
        return _empty_task(current_time)


@router.post("/audio")
async def capture_audio(request: Request):
    """
    AUDIO MODE: Accepts audio as base64-encoded JSON.
    Expects: { "audio_base64": "...", "filename": "voice_recording.m4a" }
    Returns parsed task + base64 TTS audio response for playback.
    """
    current_time = datetime.utcnow()
    try:
        body = await request.json()
        audio_b64 = body.get("audio_base64", "")
        filename = body.get("filename", "voice_recording.m4a")

        print(f"🎤 Audio capture: filename={filename}, base64_len={len(audio_b64)}")

        if not audio_b64:
            return {"error": "No audio data provided", "input_mode": "audio"}

        # Decode base64 to raw bytes
        audio_bytes = base64.b64decode(audio_b64)
        print(f"🎤 Decoded audio: {len(audio_bytes)} bytes")

        if len(audio_bytes) == 0:
            return {"error": "Empty audio data", "input_mode": "audio"}

        # 1. Transcribe with Whisper
        transcription = await transcribe_audio(audio_bytes, filename)
        if not transcription:
            return {
                "error": "Could not transcribe audio. Please try speaking more clearly.",
                "input_mode": "audio",
            }
        print(f"🎤 Transcription: {transcription}")

        # 2. Parse into task
        parsed_data = await parse_smart_input(transcription, current_time)
        _serialize_deadline(parsed_data)
        parsed_data["input_mode"] = "audio"
        parsed_data["transcription"] = transcription

        # 3. Generate TTS audio response
        tts_bytes = await generate_audio_response(parsed_data)
        if tts_bytes:
            parsed_data["audio_response"] = base64.b64encode(tts_bytes).decode('utf-8')
        else:
            parsed_data["audio_response"] = None

        print(f"✅ Audio parsed: title='{parsed_data.get('title')}', has_audio={bool(tts_bytes)}")
        return parsed_data

    except Exception as e:
        print(f"❌ Audio capture error: {e}")
        import traceback; traceback.print_exc()
        return {"error": str(e), "input_mode": "audio"}


@router.post("/file")
async def capture_file(request: Request):
    """
    FILE/IMAGE MODE: Accepts files as base64-encoded JSON.
    Expects: { "files": [{"base64": "...", "filename": "photo.jpg", "mimeType": "image/jpeg"}], "text": "" }
    """
    current_time = datetime.utcnow()
    try:
        body = await request.json()
        files_data = body.get("files", [])
        text = str(body.get("text", "")).strip()

        print(f"📎 File capture: {len(files_data)} files, text_len={len(text)}")

        combined_parts = []
        extracted_filenames = []

        if text:
            combined_parts.append(text)

        for file_info in files_data:
            file_b64 = file_info.get("base64", "")
            filename = file_info.get("filename", "unknown")
            mime_type = file_info.get("mimeType", "")

            if not file_b64:
                print(f"⚠️ Skipping {filename}: no base64 data")
                continue

            file_bytes = base64.b64decode(file_b64)
            print(f"📎 Processing: {filename}, size: {len(file_bytes)} bytes, mime: {mime_type}")
            extracted_filenames.append(filename)

            if is_image_file(filename) or mime_type.startswith("image/"):
                print(f"🖼️ Routing {filename} through Vision pipeline...")
                image_text = await extract_image_text(file_bytes, filename)
                if image_text:
                    combined_parts.append(f"[Image: {filename}]: {image_text}")
            else:
                file_text = extract_file_text(file_bytes, filename)
                if file_text:
                    combined_parts.append(f"[File: {filename}]: {file_text}")

        combined_text = "\n\n".join(combined_parts) if combined_parts else ""
        print(f"📝 File combined input ({len(combined_text)} chars): {combined_text[:300]}")

        if not combined_text.strip():
            return {"error": "Could not extract any content from the files", "input_mode": "file"}

        parsed_data = await parse_smart_input(combined_text, current_time)
        _serialize_deadline(parsed_data)
        parsed_data["input_mode"] = "file"
        parsed_data["processed_files"] = extracted_filenames
        print(f"✅ File parsed: {parsed_data}")
        return parsed_data

    except Exception as e:
        print(f"❌ File capture error: {e}")
        import traceback; traceback.print_exc()
        return {"error": str(e), "input_mode": "file"}


# ─── Helpers ───

def _serialize_deadline(parsed_data: dict):
    if "deadline" in parsed_data and isinstance(parsed_data["deadline"], datetime):
        parsed_data["deadline"] = parsed_data["deadline"].isoformat()


def _empty_task(current_time: datetime) -> dict:
    return {
        "title": "Untitled Task",
        "description": "",
        "deadline": current_time.isoformat(),
        "category": "task",
        "priority": "medium",
        "estimated_minutes": 30,
        "input_mode": "text",
    }
