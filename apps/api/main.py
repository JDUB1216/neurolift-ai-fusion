from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import simulation, avatars, sessions, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialise DB connections, load configs, etc.
    yield
    # Shutdown: cleanup

app = FastAPI(
    title="NeuroLift API",
    description="Backend for the NeuroLift AI Fusion simulation platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://neurolift.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(simulation.router, prefix="/simulation", tags=["simulation"])
app.include_router(avatars.router, prefix="/avatars", tags=["avatars"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
