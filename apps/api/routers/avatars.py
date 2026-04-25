from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class AvatarProfile(BaseModel):
    id: str
    name: str
    adhd_traits: list[str]
    experience_level: int = 0
    description: Optional[str] = None


# Seed avatars — replace with Supabase query in production
_avatars: list[AvatarProfile] = [
    AvatarProfile(
        id="avatar-attention",
        name="Alex",
        adhd_traits=["attention_deficit", "hyperfocus"],
        experience_level=0,
        description="Struggles with sustained attention but enters deep hyperfocus states.",
    ),
    AvatarProfile(
        id="avatar-executive",
        name="Jordan",
        adhd_traits=["executive_dysfunction", "task_initiation"],
        experience_level=0,
        description="Challenges with planning, starting tasks, and time management.",
    ),
    AvatarProfile(
        id="avatar-hyperactive",
        name="Riley",
        adhd_traits=["hyperactivity", "impulsivity"],
        experience_level=0,
        description="High energy with impulse control challenges.",
    ),
]


@router.get("/", response_model=list[AvatarProfile])
async def list_avatars():
    return _avatars


@router.get("/{avatar_id}", response_model=AvatarProfile)
async def get_avatar(avatar_id: str):
    for av in _avatars:
        if av.id == avatar_id:
            return av
    raise HTTPException(status_code=404, detail="Avatar not found")
