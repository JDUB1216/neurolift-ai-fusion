from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter()


class StartSessionRequest(BaseModel):
    avatar_id: str
    scenario_id: Optional[str] = None
    user_id: str


class SessionResponse(BaseModel):
    session_id: str
    status: str
    avatar_id: str
    scenario_id: Optional[str]


class StepRequest(BaseModel):
    session_id: str
    action: str
    parameters: Optional[dict] = None


# In-memory store — replace with DB in production
_sessions: dict[str, dict] = {}


@router.post("/start", response_model=SessionResponse)
async def start_simulation(req: StartSessionRequest):
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "session_id": session_id,
        "status": "running",
        "avatar_id": req.avatar_id,
        "scenario_id": req.scenario_id,
        "user_id": req.user_id,
        "steps": [],
    }
    return SessionResponse(
        session_id=session_id,
        status="running",
        avatar_id=req.avatar_id,
        scenario_id=req.scenario_id,
    )


@router.post("/step")
async def step_simulation(req: StepRequest):
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["status"] != "running":
        raise HTTPException(status_code=400, detail="Session is not running")

    # Placeholder: forward to core simulation engine
    result = {"step": len(session["steps"]) + 1, "action": req.action, "outcome": "pending"}
    session["steps"].append(result)
    return result


@router.post("/pause/{session_id}")
async def pause_simulation(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["status"] = "paused"
    return {"session_id": session_id, "status": "paused"}


@router.post("/resume/{session_id}")
async def resume_simulation(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["status"] = "running"
    return {"session_id": session_id, "status": "running"}


@router.get("/state/{session_id}")
async def get_state(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
