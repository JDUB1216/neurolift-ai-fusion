"""
Advocate System

The Advocate system represents the fusion of trained Avatar experience with Aide
expertise. Advocates combine lived understanding of ADHD struggles with proven
coaching strategies, creating AI that both empathizes and provides effective
solutions.

Key Components:
- BaseAdvocate: Core Advocate behavior and capabilities
- FusionEngine: Manages Avatar-Aide fusion process
- Advocate Configs: Configuration files for fused Advocates
"""

from .base_advocate import BaseAdvocate, AdvocateCapabilities, FusionResult
# Fusion engine module not yet implemented
# from .fusion_engine import FusionEngine, FusionReadiness, FusionCriteria

__all__ = [
    "BaseAdvocate",
    "AdvocateCapabilities",
    "FusionResult",
    # Additional exports will be added as modules are implemented
]