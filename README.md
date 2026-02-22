<p align="center">
  <h1 align="center">⚡ FocusFlow — AI-Powered Smart Productivity System</h1>
  <p align="center">
    <b>SPIT Hackathon 2026 — Team Vajra</b><br/>
    An intelligent life management system that uses AI to capture, organize, and manage tasks through text, voice, and file inputs — with automated phone call reminders via Twilio.
  </p>
</p>

---

## 🎯 Problem Statement

Students and professionals struggle with:
- **Information overload** — tasks scattered across notes, emails, and calendars
- **Poor time awareness** — missing deadlines due to lack of smart reminders
- **Burnout** — no visibility into workload distribution and stress levels
- **Context switching** — manually entering tasks from voice notes, documents, and emails

**FocusFlow solves this** by providing an AI-powered unified productivity hub that:
1. Captures tasks from **text, voice, and file uploads** using OpenAI Whisper + GPT-4o-mini
2. Automatically prioritizes and categorizes tasks
3. Integrates **Google Calendar & Gmail** for a unified schedule view
4. Sends **automated phone call reminders** via Twilio at user-configured times
5. Provides **burnout risk analysis** and workload visualization

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React Native + Expo)              │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Home    │  │ Calendar │  │ Insights │  │ Settings │          │
│  │  Screen  │  │  Screen  │  │  Screen  │  │  Screen  │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │              │               │
│  ┌────┴──────────────┴──────────────┴──────────────┴─────┐        │
│  │              AppContext (Global State Manager)          │        │
│  │    • Auth  • Tasks  • Theme  • Google Tokens           │        │
│  └──────────────────────┬────────────────────────────────┘        │
│                         │ REST API (fetch)                         │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Python)                       │
│                                                                     │
│  ┌─── API Routers ──────────────────────────────────────────────┐  │
│  │  /api/tasks/      → CRUD operations (SQLite)                 │  │
│  │  /api/capture/    → Smart Capture (OpenAI Whisper + GPT-4o)  │  │
│  │  /api/planner/    → Daily Planner & Burnout Analysis         │  │
│  │  /api/voice/      → Twilio Voice Agent (TwiML)               │  │
│  │  /api/google/     → Google Calendar & Gmail Integration      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─── AI Engines ───────────────────────────────────────────────┐  │
│  │  capture_engine.py    → Whisper transcription + GPT parsing  │  │
│  │  burnout_engine.py    → Workload & stress level analysis     │  │
│  │  scheduling_engine.py → Smart task scheduling                │  │
│  │  reminders.py         → Automated reminder system            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─── External Services ────────────────────────────────────────┐  │
│  │  OpenAI API       → GPT-4o-mini + Whisper                   │  │
│  │  Twilio           → Automated phone calls                   │  │
│  │  Google APIs      → Calendar events + Gmail messages         │  │
│  │  ngrok            → Public URL tunnel for Twilio webhooks    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Database: SQLite (focusflow.db)                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
spithack/
├── backend/
│   ├── main.py                  # FastAPI app entry point + Twilio scheduler
│   ├── database.py              # SQLAlchemy engine & session setup
│   ├── models.py                # Database models (Task, UserReflection)
│   ├── schemas.py               # Pydantic validation schemas
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (see below)
│   ├── focusflow.db             # SQLite database (auto-created)
│   ├── routers/
│   │   ├── tasks.py             # CRUD endpoints for tasks
│   │   ├── capture.py           # Smart Capture (text + audio + file → AI)
│   │   ├── planner.py           # Daily planner & burnout analysis
│   │   ├── voice.py             # Twilio voice agent (TwiML responses)
│   │   └── google_services.py   # Google Calendar & Gmail API integration
│   └── engines/
│       ├── capture_engine.py    # OpenAI Whisper + GPT-4o-mini parsing
│       ├── burnout_engine.py    # Burnout risk calculation
│       ├── scheduling_engine.py # Task scheduling logic
│       └── reminders.py         # Automated task reminders
│
├── frontend/
│   ├── App.js                   # Root navigator with screen transitions
│   ├── app.json                 # Expo configuration
│   ├── package.json             # Node dependencies
│   ├── assets/                  # App icons and images
│   └── src/
│       ├── config/
│       │   └── api.js           # Dynamic API URL detection
│       ├── context/
│       │   └── AppContext.js    # Global state (auth, tasks, Google, theme)
│       ├── navigation/
│       │   └── MainTabs.js      # Bottom tab navigator with animations
│       ├── components/
│       │   └── AnimatedScreenWrapper.js  # Reusable animation components
│       └── screens/
│           ├── SplashScreen.js       # Animated splash with particles
│           ├── LoginScreen.js        # Login + Google OAuth
│           ├── SignupScreen.js       # Account creation
│           ├── HomeScreen.js         # Dashboard with focus score
│           ├── CalendarScreen.js     # Calendar + Google events
│           ├── SmartCaptureScreen.js # AI task capture (text/voice/file)
│           ├── InsightsScreen.js     # Analytics & burnout tracking
│           ├── SettingsScreen.js     # Profile, Google, theme, reminders
│           ├── WorkspaceScreen.js    # Task workspace per date
│           └── EditProfileScreen.js  # Profile editing
│
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# ─── Database ───
DATABASE_URL=sqlite:///./focusflow.db

# ─── OpenAI (Required for Smart Capture AI) ───
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# ─── Twilio (Required for Phone Call Reminders) ───
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
MY_PHONE_NUMBER=+91XXXXXXXXXX

# ─── ngrok (Required for Twilio webhook URL) ───
NGROK_URL=https://your-subdomain.ngrok-free.dev

# ─── Google OAuth (Required for Calendar & Gmail) ───
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Where to get these keys:

| Variable | Source |
|---|---|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `TWILIO_*` | [console.twilio.com](https://console.twilio.com) → Account Info |
| `NGROK_URL` | Run `ngrok http 8000` → use the generated HTTPS URL |
| `GOOGLE_CLIENT_ID` | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Same location as Client ID |

---

## 🚀 Setup & Installation

### Prerequisites

- **Python 3.11+** — [python.org/downloads](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Expo Go app** — Install on your phone from App Store / Play Store
- **ngrok** (for Twilio) — [ngrok.com/download](https://ngrok.com/download)

---

### 1. Clone the Repository

```bash
git clone https://github.com/SPIT-Hackathon-2026/Vajra.git
cd Vajra
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Also install these (needed but may not be in requirements.txt):
pip install twilio apscheduler

# Create your .env file (see Environment Variables section above)

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

✅ You should see: `Uvicorn running on http://0.0.0.0:8000`

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start Expo
npm start
```

✅ Scan the QR code with **Expo Go** on your phone (both devices must be on the same WiFi network).

### 4. ngrok Setup (for Twilio calls)

Open a **third terminal**:

```bash
ngrok http 8000
```

Copy the generated HTTPS URL (e.g., `https://abc123.ngrok-free.dev`) and paste it into `backend/.env` as `NGROK_URL`.

---

## 📱 Features

| Feature | Description |
|---|---|
| **🤖 Smart Capture** | Describe a task via text, voice recording, or file upload — AI extracts title, deadline, priority, and category automatically |
| **📅 Calendar View** | Visual workload heatmap + integrated Google Calendar events |
| **📊 Insights** | Task completion rates, burnout risk score, habit streak tracking |
| **📞 Reminder Calls** | Twilio-powered automated phone calls that read your pending tasks and capture voice notes |
| **🔗 Google Integration** | Connect Google Calendar + Gmail to see events and emails alongside tasks |
| **🌙 Dark Mode** | Full dark/light theme system across all screens |
| **✨ Animations** | Smooth page transitions, tab switching animations, staggered entrance effects |
| **🔐 Authentication** | Email/password login + Google OAuth2 login |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks/` | Fetch all tasks |
| `POST` | `/api/tasks/` | Create a new task |
| `PATCH` | `/api/tasks/{id}` | Update a task |
| `DELETE` | `/api/tasks/{id}` | Delete a task |
| `POST` | `/api/capture/` | Smart Capture — send text/audio/files for AI parsing |
| `GET` | `/api/planner/daily` | Get daily plan with burnout analysis |
| `POST` | `/api/voice/start` | Twilio voice call webhook (start) |
| `POST` | `/api/voice/respond` | Twilio voice call webhook (response) |
| `POST` | `/api/google/verify-token` | Verify Google OAuth token |
| `GET` | `/api/google/calendar/events` | Fetch Google Calendar events |
| `GET` | `/api/google/gmail/messages` | Fetch Gmail messages |
| `GET` | `/api/test-call` | Manually trigger a Twilio reminder call |

---

## 🛠️ Troubleshooting

### Common Errors & Fixes

<details>
<summary><b>❌ 422 Unprocessable Content on PATCH /api/tasks/</b></summary>

**Cause:** The `task_id` parameter type in `routers/tasks.py` might be set to `int` instead of `str`. The database uses UUID strings as primary keys.

**Fix:** In `backend/routers/tasks.py`, ensure:
```python
def update_task(task_id: str, updates: schemas.TaskUpdate, ...):
```
</details>

<details>
<summary><b>❌ 422 on POST /api/capture/ (SmartCapture)</b></summary>

**Cause:** FastAPI's strict `Form()` + `File()` parameter validation rejects React Native's FormData format.

**Fix:** The capture endpoint should use `Request` object for manual form parsing:
```python
@router.post("/")
async def capture_input(request: Request):
    form = await request.form()
    text = form.get("text", "")
    audio = form.get("audio")
    # ... process manually
```
</details>

<details>
<summary><b>❌ 500 on Google Calendar/Gmail endpoints</b></summary>

**Cause:** Google OAuth access tokens expire after ~1 hour. This is expected behavior.

**Fix:** Re-connect Google from Settings → Connected Accounts → Disconnect → Connect again to get a fresh token. The frontend handles these errors gracefully.
</details>

<details>
<summary><b>❌ "Network request failed" on Expo Go</b></summary>

**Cause:** The phone and computer are not on the same WiFi network, or the backend isn't running.

**Fix:**
1. Ensure both devices are on the **same WiFi network**
2. Check that the backend is running: `http://localhost:8000/` should return `{"status": "operational"}`
3. If on a physical device, update `MACHINE_IP` in `frontend/src/config/api.js` with your computer's local IP
</details>

<details>
<summary><b>❌ Port 8081 already in use</b></summary>

**Cause:** Another Expo process is running on that port.

**Fix:** Run Expo with cache clearing:
```bash
npx expo start -c
```
Or kill the process using port 8081 and restart.
</details>

<details>
<summary><b>❌ Sign Out button doesn't work</b></summary>

**Cause:** The Settings screen is inside a nested tab navigator, so `navigation.replace('Login')` can't reach the root stack.

**Fix:** Use `navigation.getParent().dispatch(CommonActions.reset(...))` to access the root navigator.
</details>

<details>
<summary><b>❌ Twilio calls not working</b></summary>

**Cause:** ngrok URL is expired or not set.

**Fix:**
1. Run `ngrok http 8000` in a new terminal
2. Copy the new HTTPS URL
3. Update `NGROK_URL` in `backend/.env`
4. Restart the backend server
</details>

---

## 🧠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance async Python API framework |
| **SQLAlchemy + SQLite** | ORM and lightweight database |
| **OpenAI GPT-4o-mini** | Natural language task parsing |
| **OpenAI Whisper** | Audio transcription (voice → text) |
| **Twilio** | Automated phone call reminders |
| **Google APIs** | Calendar events & Gmail integration |
| **APScheduler** | Background job scheduling for reminders |
| **ngrok** | HTTPS tunneling for Twilio webhooks |

### Frontend
| Technology | Purpose |
|---|---|
| **React Native** | Cross-platform mobile framework |
| **Expo SDK 52** | Development toolchain & native APIs |
| **React Navigation 6** | Stack + Bottom Tab navigation |
| **expo-av** | Audio recording for voice input |
| **expo-document-picker** | File attachment for Smart Capture |
| **expo-auth-session** | Google OAuth2 authentication |
| **AsyncStorage** | Local data persistence |
| **React Native Animated** | Smooth UI animations throughout |

---

## 👥 Team Vajra

Built with ❤️ at **SPIT Hackathon 2026**

---

## 📄 License

This project was built for the SPIT Hackathon 2026 competition.
