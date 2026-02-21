"""Regression tests for fusion engine review feedback."""

from src.core.events import EventBus
from src.avatars.base_avatar import BaseAvatar
from src.aides.base_aide import BaseAide
from src.fusion import (
    DimensionScore,
    FusionDimension,
    FusionEngine,
    FusionReadiness,
    ReadinessAssessor,
)


class _TestAvatar(BaseAvatar):
    def get_adhd_trait_impact(self, task_context):
        return {
            "difficulty_modifier": 1.2,
            "quality_modifier": 0.1,
            "time_modifier": 1.0,
            "cognitive_load_modifier": 0.1,
        }

    def simulate_struggle(self, task_context):
        return ["focus_drift"]


class _EncapsulationAide(BaseAide):
    def get_expertise_strategies(self, context):
        return [{
            "strategy": "Break into smaller steps",
            "techniques": ["chunking"],
            "expected_outcomes": ["reduced overwhelm"],
            "effectiveness": 0.8,
        }]

    def get_real_world_insights(self, context):
        return []

    def get_strategy_effectiveness_summary(self):
        # Public API expected by readiness/fusion components.
        return {
            "Break into smaller steps": {"times_used": 3, "effectiveness": 0.8}
        }

    def _get_strategy_effectiveness_summary(self):
        raise AssertionError("Fusion/readiness should not use private strategy API")


def test_fusion_package_exports_readiness_types():
    assert FusionEngine is not None
    assert ReadinessAssessor is not None
    assert FusionReadiness is not None
    assert FusionDimension is not None
    assert DimensionScore is not None


def test_fusion_report_success_tracks_validation_result():
    bus = EventBus()
    avatar = _TestAvatar("avatar_fusion", {"trait_name": "attention"}, event_bus=bus)
    aide = _EncapsulationAide(
        "aide_fusion",
        {"expertise_area": "attention_coaching"},
        event_bus=bus,
    )
    engine = FusionEngine(event_bus=bus)

    report = engine.fuse(avatar, aide, force=True)

    assert report.fusion_result is not None
    assert report.fusion_result.validation_results["all_passed"] is False
    assert report.success is False
    assert report.failure_reason is not None


def test_readiness_and_fusion_use_public_aide_strategy_api():
    bus = EventBus()
    avatar = _TestAvatar("avatar_public_api", {"trait_name": "attention"}, event_bus=bus)
    aide = _EncapsulationAide(
        "aide_public_api",
        {"expertise_area": "attention_coaching"},
        event_bus=bus,
    )

    assessor = ReadinessAssessor()
    readiness = assessor.assess(avatar, aide)
    assert FusionDimension.STRATEGY_INTERNALISATION in readiness.dimension_scores

    engine = FusionEngine(event_bus=bus)
    report = engine.fuse(avatar, aide, force=True)
    assert report.fusion_result is not None
