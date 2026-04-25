from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import datetime

router = APIRouter()


class SessionSummary(BaseModel):
    session_id: str
    user_id: str
    avatar_id: str
    started_at: str
    ended_at: Optional[str]
    duration_minutes: Optional[float]
    achievements: list[str] = []


@router.get("/user/{user_id}", response_model=list[SessionSummary])
async def list_user_sessions(user_id: str):
    # TODO: query Supabase
    return []


@router.get("/{session_id}/summary", response_model=SessionSummary)
async def get_session_summary(session_id: str):
    # TODO: query Supabase
    return SessionSummary(
        session_id=session_id,
        user_id="unknown",
        avatar_id="unknown",
        started_at=datetime.datetime.utcnow().isoformat(),
        ended_at=None,
        duration_minutes=None,
    )
