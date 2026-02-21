from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import tasks, planner, capture

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FocusFlow AI System",
    description="Intelligent Life Management System Backend",
    version="1.0.0"
)

# CORS Configuration for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to your app's domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(capture.router)
app.include_router(tasks.router)
app.include_router(planner.router)

@app.get("/")
def health_check():
    return {"status": "operational", "system": "FocusFlow Engine V1"}