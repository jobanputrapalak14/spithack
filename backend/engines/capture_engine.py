import os
import io
import json
import base64
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Supported image extensions for Vision-based extraction
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'}

# Maximum file size for Whisper API (25 MB)
WHISPER_MAX_BYTES = 25 * 1024 * 1024


async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    """
    Transcribe audio bytes using OpenAI Whisper API.
    Supports: mp3, mp4, m4a, wav, webm, mpeg, mpga, oga, ogg, flac
    Returns the transcribed text string.
    """
    if not file_bytes or len(file_bytes) == 0:
        print("⚠️ Audio transcription skipped: empty audio data")
        return ""

    if len(file_bytes) > WHISPER_MAX_BYTES:
        print(f"⚠️ Audio file too large ({len(file_bytes)} bytes). Whisper limit is 25MB.")
        return ""

    try:
        audio_file = io.BytesIO(file_bytes)
        # Ensure the filename has a valid extension for Whisper
        valid_audio_exts = {'.mp3', '.mp4', '.m4a', '.wav', '.webm', '.mpeg', '.mpga', '.oga', '.ogg', '.flac'}
        ext = os.path.splitext(filename)[1].lower()
        if ext not in valid_audio_exts:
            filename = filename.rsplit('.', 1)[0] + '.m4a'  # Default to m4a
        audio_file.name = filename

        # Reject suspiciously small audio (likely empty/silent recording)
        if len(file_bytes) < 4000:
            print(f"⚠️ Audio too small ({len(file_bytes)} bytes) — likely empty recording")
            return ""

        transcript = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",
        )
        result = transcript.text.strip()
        print(f"🎤 Whisper transcription ({len(result)} chars): {result}")
        return result
    except Exception as e:
        print(f"⚠️ Audio transcription failed: {e}")
        return ""


async def extract_image_text(file_bytes: bytes, filename: str) -> str:
    """
    Use GPT-4o-mini vision to extract text, dates, deadlines, and task-related
    information from an image (screenshot, photo of whiteboard, handwritten note, etc).
    """
    if not file_bytes or len(file_bytes) == 0:
        return f"[Image file: {filename} - empty]"

    try:
        ext = os.path.splitext(filename)[1].lower()
        mime_map = {
            '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
            '.tiff': 'image/tiff',
        }
        mime = mime_map.get(ext, 'image/png')
        b64 = base64.b64encode(file_bytes).decode('utf-8')

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "You are a text extraction assistant for a productivity app. "
                            "Extract ALL readable text from this image. Pay special attention to:\n"
                            "- Task names, to-do items, assignments\n"
                            "- Dates, deadlines, due dates (exact or relative)\n"
                            "- Priority indicators (urgent, important, ASAP, etc.)\n"
                            "- Subject/course names or project names\n"
                            "- Any numbers, times, or durations mentioned\n\n"
                            "Return the extracted information as clear, structured plain text. "
                            "If the image contains a to-do list, preserve the list format. "
                            "If no text is found, describe what the image shows briefly."
                        )
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{b64}"}
                    }
                ]
            }],
            max_tokens=600,
            temperature=0.1
        )
        result = response.choices[0].message.content.strip()
        print(f"🖼️ Image extraction ({len(result)} chars): {result[:200]}...")
        return result
    except Exception as e:
        print(f"⚠️ Image text extraction failed for {filename}: {e}")
        return f"[Image file: {filename} - extraction failed]"


def is_image_file(filename: str) -> bool:
    """Check if a file is an image based on its extension."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in IMAGE_EXTENSIONS


def extract_file_text(file_bytes: bytes, filename: str) -> str:
    """
    Extract readable text content from common file types.
    Supports: .txt, .md, .csv, .json, .pdf
    Returns extracted text or a fallback label for unsupported types.
    """
    ext = os.path.splitext(filename)[1].lower()

    # Plain text formats
    if ext in ('.txt', '.md', '.csv', '.json', '.log', '.py', '.js', '.html'):
        try:
            return file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return file_bytes.decode('latin-1', errors='ignore')

    # PDF extraction
    if ext == '.pdf':
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            return "\n".join(pages_text) if pages_text else f"[PDF file: {filename} - no extractable text]"
        except Exception as e:
            print(f"⚠️ PDF extraction failed for {filename}: {e}")
            return f"[PDF file: {filename} - extraction failed]"

    # Unsupported type — return filename as context
    return f"[Attached file: {filename}]"


def _get_day_name(dt: datetime) -> str:
    """Return the day name for a datetime."""
    return dt.strftime("%A")


async def parse_smart_input(text: str, current_time: datetime) -> dict:
    """
    Parses messy user inputs (text, transcribed audio, extracted file/image content)
    into structured task data using GPT-4o-mini with deep date awareness.
    """
    # Build rich date context for the model
    today = current_time.date()
    tomorrow = today + timedelta(days=1)
    day_after = today + timedelta(days=2)

    # Calculate next Monday-Sunday for relative day references
    days_ahead = {}
    for i in range(7):
        future = today + timedelta(days=i)
        day_name = future.strftime("%A")
        days_ahead[day_name] = future.isoformat()

    system_prompt = f"""You are a smart task parser for the FocusFlow productivity app.
Your job is to extract structured task information from user input, which may include:
- Typed text from the user
- Transcribed voice recordings (marked with [Voice input])
- Text extracted from images (marked with [Image])
- Content from attached files (marked with [File])

=== CURRENT DATE & TIME CONTEXT ===
- Right now: {current_time.strftime("%A, %B %d, %Y at %I:%M %p")}
- Today: {today.strftime("%A, %B %d, %Y")}
- Tomorrow: {tomorrow.strftime("%A, %B %d, %Y")}
- Day after tomorrow: {day_after.strftime("%A, %B %d, %Y")}
- This week's dates:
{chr(10).join(f'  {name}: {date}' for name, date in days_ahead.items())}

=== DATE INTERPRETATION RULES ===
- "tomorrow" → {tomorrow.isoformat()}
- "day after tomorrow" → {day_after.isoformat()}
- "next Monday/Tuesday/etc." → The NEXT occurrence of that day AFTER today
- "this Friday" → This week's Friday (if today is before Friday, otherwise next week)
- "end of week" → This coming Sunday
- "next week" → Next Monday
- "tonight" / "today evening" → Today at 20:00
- "in X days" → Add X days to today
- "by [date]" → That date at 23:59
- If NO date/deadline is mentioned at all → Default to 3 days from now
- NEVER return a deadline that is in the past

=== PRIORITY RULES ===
- "urgent", "ASAP", "immediately", "critical", "do now" → "high"
- "important", "soon", "this week" → "medium"
- "whenever", "no rush", "low priority", "someday" → "low"
- Exams, interviews, submissions → default "high"
- General tasks with no urgency cue → "medium"

=== CATEGORY RULES ===
- "assignment", "homework", "project", "exam", "submission", "quiz", "test" → "assignment"
- "habit", "daily", "routine", "every day", "workout", "meditate", "exercise" → "habit"
- Everything else → "task"

=== OUTPUT FORMAT ===
Return ONLY a valid JSON object with these EXACT keys:
{{
  "title": "A clean, concise, actionable title (max 60 chars)",
  "description": "A brief 1-sentence description with any extra context from the input (or empty string if none)",
  "category": "task" | "assignment" | "habit",
  "priority": "high" | "medium" | "low",
  "deadline": "ISO 8601 datetime string (YYYY-MM-DDTHH:MM:SS)",
  "estimated_minutes": <integer estimate of how long this task takes, default 30>
}}

=== EXAMPLES ===
Input: "submit math assignment by next Monday urgent"
Output: {{"title": "Submit math assignment", "description": "Math assignment submission", "category": "assignment", "priority": "high", "deadline": "{(today + timedelta(days=(7 - today.weekday()) % 7 or 7)).isoformat()}T23:59:00", "estimated_minutes": 60}}

Input: "buy groceries tomorrow"
Output: {{"title": "Buy groceries", "description": "", "category": "task", "priority": "medium", "deadline": "{tomorrow.isoformat()}T18:00:00", "estimated_minutes": 45}}

Input: "start going to gym daily"
Output: {{"title": "Go to gym", "description": "Daily gym habit", "category": "habit", "priority": "medium", "deadline": "{today.isoformat()}T07:00:00", "estimated_minutes": 60}}"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        result = json.loads(response.choices[0].message.content)
        print(f"🧠 GPT parsed result: {json.dumps(result, indent=2)}")

        # Validate and fix the deadline
        if "deadline" in result and isinstance(result["deadline"], str):
            try:
                clean_date = result["deadline"].replace('Z', '+00:00')
                parsed_deadline = datetime.fromisoformat(clean_date).replace(tzinfo=None)

                # Safety: if deadline is in the past, push it forward
                if parsed_deadline < current_time:
                    print(f"⚠️ Deadline was in the past ({parsed_deadline}), adjusting to 3 days from now")
                    parsed_deadline = current_time + timedelta(days=3)
                    parsed_deadline = parsed_deadline.replace(hour=23, minute=59, second=0)

                result["deadline"] = parsed_deadline
            except (ValueError, TypeError) as e:
                print(f"⚠️ Could not parse deadline string '{result['deadline']}': {e}")
                result["deadline"] = current_time + timedelta(days=3)

        # Validate category
        if result.get("category") not in ("task", "assignment", "habit"):
            result["category"] = "task"

        # Validate priority
        if result.get("priority") not in ("high", "medium", "low"):
            result["priority"] = "medium"

        # Ensure estimated_minutes is an int
        try:
            result["estimated_minutes"] = int(result.get("estimated_minutes", 30))
        except (ValueError, TypeError):
            result["estimated_minutes"] = 30

        # Ensure description exists
        if "description" not in result:
            result["description"] = ""

        return result

    except Exception as e:
        print(f"⚠️ LLM parsing failed: {e}. Falling back to rule-based engine.")
        return _fallback_parser(text, current_time)


def _fallback_parser(text: str, current_time: datetime) -> dict:
    """Fallback if OpenAI is down/rate-limited to save the Hackathon demo."""
    text_lower = text.lower()

    # Try to detect some date keywords
    deadline = current_time + timedelta(days=3)  # default
    if "tomorrow" in text_lower:
        deadline = current_time + timedelta(days=1)
    elif "today" in text_lower or "tonight" in text_lower:
        deadline = current_time
    elif "next week" in text_lower:
        deadline = current_time + timedelta(days=7)
    deadline = deadline.replace(hour=23, minute=59, second=0, microsecond=0)

    # Detect priority
    priority = "medium"
    if any(w in text_lower for w in ("urgent", "asap", "critical", "important")):
        priority = "high"
    elif any(w in text_lower for w in ("no rush", "whenever", "low priority")):
        priority = "low"

    # Detect category
    category = "task"
    if any(w in text_lower for w in ("assignment", "homework", "exam", "quiz", "submission", "project")):
        category = "assignment"
    elif any(w in text_lower for w in ("habit", "daily", "routine", "every day", "workout")):
        category = "habit"

    return {
        "title": text[:80].strip() if text else "Untitled Task",
        "description": "",
        "category": category,
        "priority": priority,
        "deadline": deadline,
        "estimated_minutes": 30,
    }


async def generate_audio_response(parsed_data: dict) -> bytes:
    """
    Generate a spoken audio response summarizing the parsed task using OpenAI TTS.
    Returns MP3 bytes that the frontend can play back.
    """
    # Build a natural-sounding summary sentence
    title = parsed_data.get("title", "your task")
    priority = parsed_data.get("priority", "medium")
    category = parsed_data.get("category", "task")
    deadline_raw = parsed_data.get("deadline", "")
    estimated = parsed_data.get("estimated_minutes", 30)

    # Format the deadline nicely for speech
    deadline_str = "in a few days"
    if deadline_raw:
        try:
            if isinstance(deadline_raw, str):
                dl = datetime.fromisoformat(deadline_raw.replace('Z', '+00:00')).replace(tzinfo=None)
            elif isinstance(deadline_raw, datetime):
                dl = deadline_raw
            else:
                dl = None
            if dl:
                deadline_str = dl.strftime("%A, %B %d at %I:%M %p")
        except Exception:
            pass

    speech_text = (
        f"Got it! I've captured this as a {priority} priority {category}: "
        f"\"{title}\". "
        f"The deadline is set for {deadline_str}, "
        f"and I estimate it'll take about {estimated} minutes. "
        f"Would you like to save this or make any changes?"
    )

    try:
        response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=speech_text,
            response_format="mp3",
        )
        audio_bytes = response.content
        print(f"🔊 TTS generated: {len(audio_bytes)} bytes for: {speech_text[:80]}...")
        return audio_bytes
    except Exception as e:
        print(f"⚠️ TTS generation failed: {e}")
        return b""