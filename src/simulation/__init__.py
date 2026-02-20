"""
Simulation Environment

The simulation environment creates realistic scenarios where Avatars experience
authentic ADHD struggles while Aides provide real-time coaching. The environment
includes world physics, time systems, consequences, NPCs, and scenario management.

Key Components:
- Environment: Core simulation engine and world management
- Scenarios: Library of workplace, personal, and social scenarios
- NPCs: Non-player characters for social dynamics and comparison
- Challenges: Dynamic difficulty and random dysfunction injection
- Training Loop: Core training logic and session management
"""

from .environment import (
    WorldEngine,
    SimulationState,
    Event,
    # Additional environment exports will be added as modules are implemented
)

# Placeholder for SimulationEnvironment - define it here for now
class SimulationEnvironment(WorldEngine):
    """Alias for WorldEngine to maintain API compatibility"""
    pass

# Additional modules not yet implemented
# from .scenarios import (
#     Scenario,
#     WorkplaceScenario,
#     PersonalScenario,
#     SocialScenario,
#     ScenarioGenerator,
# )
# from .npcs import (
#     BaseNPC,
#     NeurotypicalNPC,
#     BiasedNPC,
#     SupportiveNPC,
#     NPCManager,
# )
# from .challenges import (
#     ChallengeInjector,
#     DifficultyScaling,
#     BurnoutSimulator,
# )
# from .training_loop import (
#     SessionManager,
#     AvatarAideCoordinator,
#     InteractionLogger,
# )

__all__ = [
    "SimulationEnvironment",
    "WorldEngine",
    "SimulationState",
    "Event",
    # Additional exports will be added as modules are implemented
]