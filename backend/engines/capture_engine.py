import os
import json
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def parse_smart_input(text: str, current_time: datetime) -> dict:
    """
    Parses messy user inputs into structured task data using GPT-4o-mini.
    """
    system_prompt = f"""
    You are an AI assistant for the FocusFlow productivity app.
    Extract task details from user input.
    Current date and time: {current_time.isoformat()}
    
    Return ONLY a valid JSON object with these EXACT keys:
    - "title": A clean, actionable title for the task (string).
    - "category": Must be one of ["task", "assignment", "habit"].
    - "priority": Must be one of ["high", "medium", "low"].
    - "deadline": ISO 8601 datetime string. If no time is specified, default to 23:59:59 of the target date. If no date is implied, default to 3 days from current date.
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            response_format={ "type": "json_object" },
            temperature=0.1 # Low temperature for deterministic behavior
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Convert string ISO date back to Python datetime object for the DB
        if "deadline" in result:
            # Handle standard format and Z-suffix format
            clean_date = result["deadline"].replace('Z', '+00:00')
            result["deadline"] = datetime.fromisoformat(clean_date).replace(tzinfo=None)
            
        return result

    except Exception as e:
        print(f"⚠️ LLM parsing failed: {e}. Falling back to rule-based engine.")
        return _fallback_parser(text, current_time)

def _fallback_parser(text: str, current_time: datetime) -> dict:
    """Fallback if OpenAI is down/rate-limited to save the Hackathon demo."""
    text_lower = text.lower()
    return {
        "title": text,
        "category": "assignment" if "exam" in text_lower else "task",
        "priority": "high" if "urgent" in text_lower else "medium",
        "deadline": current_time + timedelta(days=3)
    }