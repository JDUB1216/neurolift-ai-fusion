"""
Simulation Environment

Creates realistic scenarios where Avatars experience authentic ADHD
struggles while Aides provide real-time coaching.
"""

from .session_orchestrator import SessionOrchestrator, SessionConfig, SessionResult

__all__ = [
    "SessionOrchestrator",
    "SessionConfig",
    "SessionResult",
]
