from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import os
from datetime import datetime, timedelta

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

router = APIRouter(prefix="/api/google", tags=["Google Services"])

# ─── Schemas ─────────────────────────────────────────────

class TokenExchangeRequest(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = 3600

class TokenExchangeResponse(BaseModel):
    status: str
    message: str

class CalendarEvent(BaseModel):
    id: str
    title: str
    start: str
    end: str
    location: Optional[str] = None
    description: Optional[str] = None
    is_all_day: bool = False

class GmailMessage(BaseModel):
    id: str
    subject: str
    sender: str
    date: str
    snippet: str
    is_unread: bool = False

# ─── Helper: Build credentials from access token ────────

def _build_credentials(authorization: str) -> Credentials:
    """Extract the access token from the Authorization header and build Google credentials."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    access_token = authorization.replace("Bearer ", "")
    
    creds = Credentials(
        token=access_token,
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    )
    return creds

# ─── POST /api/google/verify-token ──────────────────────

@router.post("/verify-token", response_model=TokenExchangeResponse)
async def verify_token(request: TokenExchangeRequest):
    """
    Verify that the provided Google access token is valid.
    The frontend sends the token obtained via expo-auth-session.
    """
    try:
        creds = Credentials(
            token=request.access_token,
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        )
        
        # Quick verification: try to get user info
        service = build("oauth2", "v2", credentials=creds)
        user_info = service.userinfo().get().execute()
        
        return TokenExchangeResponse(
            status="success",
            message=f"Connected as {user_info.get('email', 'unknown')}"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token verification failed: {str(e)}")

# ─── GET /api/google/calendar/events ─────────────────────

@router.get("/calendar/events", response_model=List[CalendarEvent])
async def get_calendar_events(authorization: str = Header(None)):
    """
    Fetch upcoming Google Calendar events for the next 30 days.
    Requires a Bearer token in the Authorization header.
    """
    creds = _build_credentials(authorization)
    
    try:
        service = build("calendar", "v3", credentials=creds)
        
        now = datetime.utcnow()
        time_min = now.isoformat() + "Z"
        time_max = (now + timedelta(days=30)).isoformat() + "Z"
        
        events_result = service.events().list(
            calendarId="primary",
            timeMin=time_min,
            timeMax=time_max,
            maxResults=50,
            singleEvents=True,
            orderBy="startTime",
        ).execute()
        
        events = events_result.get("items", [])
        
        calendar_events = []
        for event in events:
            start = event.get("start", {})
            end = event.get("end", {})
            
            is_all_day = "date" in start
            start_str = start.get("dateTime", start.get("date", ""))
            end_str = end.get("dateTime", end.get("date", ""))
            
            calendar_events.append(CalendarEvent(
                id=event.get("id", ""),
                title=event.get("summary", "(No title)"),
                start=start_str,
                end=end_str,
                location=event.get("location"),
                description=event.get("description"),
                is_all_day=is_all_day,
            ))
        
        return calendar_events
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendar events: {str(e)}")

# ─── GET /api/google/gmail/messages ──────────────────────

@router.get("/gmail/messages", response_model=List[GmailMessage])
async def get_gmail_messages(authorization: str = Header(None), max_results: int = 10):
    """
    Fetch recent Gmail messages.
    Requires a Bearer token in the Authorization header.
    """
    creds = _build_credentials(authorization)
    
    try:
        service = build("gmail", "v1", credentials=creds)
        
        # List recent messages
        results = service.users().messages().list(
            userId="me",
            maxResults=max_results,
            labelIds=["INBOX"],
        ).execute()
        
        messages = results.get("messages", [])
        
        gmail_messages = []
        for msg_ref in messages:
            # Get full message details
            msg = service.users().messages().get(
                userId="me",
                id=msg_ref["id"],
                format="metadata",
                metadataHeaders=["Subject", "From", "Date"],
            ).execute()
            
            headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
            
            is_unread = "UNREAD" in msg.get("labelIds", [])
            
            gmail_messages.append(GmailMessage(
                id=msg["id"],
                subject=headers.get("Subject", "(No subject)"),
                sender=headers.get("From", "Unknown"),
                date=headers.get("Date", ""),
                snippet=msg.get("snippet", ""),
                is_unread=is_unread,
            ))
        
        return gmail_messages
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Gmail messages: {str(e)}")
