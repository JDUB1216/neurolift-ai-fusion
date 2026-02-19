"""
Fusion Engine

Manages the process of combining an Avatar's experiential knowledge
with an Aide's expertise to produce a fused Advocate.
"""

from .fusion_engine import FusionEngine, FusionDimension, FusionReadiness
from .readiness_assessor import ReadinessAssessor, DimensionScore

__all__ = [
    "FusionEngine",
    "FusionDimension",
    "FusionReadiness",
    "ReadinessAssessor",
    "DimensionScore",
]
