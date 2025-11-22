"""
NeuroLift Technologies Simulation Environment

A Sims/RPG-style simulation environment where AI Avatars with ADHD traits 
experience authentic life struggles while AI Aides provide real-time coaching.
After sufficient training through repeated scenarios, they fuse into Advocates 
that combine lived understanding with expert solutions.

This package implements experiential learning for AI systems, not traditional 
data training. Avatars don't just analyze patterns about ADHD - they actually 
live through the struggles, experience real stress, make mistakes, and learn 
through doing with Aide support.
"""

__version__ = "0.1.0"
__author__ = "NeuroLift Technologies"
__email__ = "contact@neuroLift.com"

# Core system imports
from .avatars import BaseAvatar
from .aides import BaseAide  
from .advocates import BaseAdvocate
from .simulation import SimulationEnvironment

__all__ = [
    "BaseAvatar",
    "BaseAide", 
    "BaseAdvocate",
    "SimulationEnvironment",
]