"""
Base Aide Class

The foundation for all coaching Aides. Implements core coaching behavior,
expertise integration, and real-time intervention capabilities.

Each Aide combines PhD-level expertise in specific executive functions with
real-world feedback from successful ADHD individuals, plus RRT foundation
for burnout response and crisis intervention.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Any, Optional, Tuple
import uuid
from datetime import datetime, timedelta

from ..avatars.base_avatar import BaseAvatar, AvatarState, TaskResult


class CoachingType(Enum):
    """Types of coaching interventions"""
    PREVENTIVE = "preventive"
    REACTIVE = "reactive"
    CRISIS = "crisis"
    RECOVERY = "recovery"
    INDEPENDENCE_BUILDING = "independence_building"


class InterventionUrgency(Enum):
    """Urgency levels for interventions"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class CoachingContext:
    """Context for coaching intervention"""
    avatar: BaseAvatar
    task_context: Dict[str, Any]
    current_struggle: List[str]
    emotional_state: str
    cognitive_load: float
    stress_level: float
    recent_performance: List[TaskResult]
    coaching_history: List[Dict[str, Any]]
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class CoachingAction:
    """A coaching intervention action"""
    action_id: str
    coaching_type: CoachingType
    urgency: InterventionUrgency
    strategy: str
    specific_techniques: List[str]
    expected_outcomes: List[str]
    stress_reduction: float = 0.0
    emotional_boost: float = 0.0
    cognitive_support: float = 0.0
    independence_building: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/storage"""
        return {
            "action_id": self.action_id,
            "coaching_type": self.coaching_type.value,
            "urgency": self.urgency.value,
            "strategy": self.strategy,
            "specific_techniques": self.specific_techniques,
            "expected_outcomes": self.expected_outcomes,
            "stress_reduction": self.stress_reduction,
            "emotional_boost": self.emotional_boost,
            "cognitive_support": self.cognitive_support,
            "independence_building": self.independence_building,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class BurnoutRisk:
    """Burnout risk assessment"""
    risk_level: str  # "low", "medium", "high", "critical"
    risk_score: float  # 0.0 to 1.0
    contributing_factors: List[str]
    early_warning_signs: List[str]
    intervention_recommendations: List[str]
    rrt_activation_needed: bool = False
    timestamp: datetime = field(default_factory=datetime.now)


class BaseAide(ABC):
    """
    Base class for all coaching Aides.
    
    Each Aide combines PhD-level expertise in specific executive functions with
    real-world feedback from successful ADHD individuals, plus RRT foundation
    for burnout response and crisis intervention.
    """
    
    def __init__(self, aide_id: str, expertise_config: Dict[str, Any]):
        self.aide_id = aide_id
        self.expertise_config = expertise_config
        self.expertise_area = expertise_config.get("expertise_area", "unknown")
        
        # Core components
        self.rrt_foundation = None  # Will be initialized by subclasses
        self.phd_expertise = None   # Will be initialized by subclasses
        self.real_world_feedback = None  # Will be initialized by subclasses
        
        # Coaching state
        self.coaching_strategies: List[Dict[str, Any]] = []
        self.intervention_history: List[CoachingAction] = []
        self.success_patterns: Dict[str, Any] = {}
        self.failure_patterns: Dict[str, Any] = {}
        
        # Performance metrics
        self.total_interventions = 0
        self.successful_interventions = 0
        self.crisis_interventions = 0
        self.independence_achievements = 0
        
        # Timestamps
        self.created_at = datetime.now()
        self.last_intervention = datetime.now()
        
    @abstractmethod
    def get_expertise_strategies(self, context: CoachingContext) -> List[Dict[str, Any]]:
        """
        Get PhD-level expertise strategies for the current context.
        
        Args:
            context: Current coaching context
            
        Returns:
            List of evidence-based strategies
        """
        pass
    
    @abstractmethod
    def get_real_world_insights(self, context: CoachingContext) -> List[Dict[str, Any]]:
        """
        Get real-world insights from successful ADHD individuals.
        
        Args:
            context: Current coaching context
            
        Returns:
            List of community wisdom and success stories
        """
        pass
    
    def observe_avatar_struggle(self, avatar: BaseAvatar, task_context: Dict[str, Any]) -> None:
        """
        Monitor Avatar's current challenges and assess intervention needs.
        
        Args:
            avatar: The Avatar experiencing struggles
            task_context: Context about the current task
        """
        # Create coaching context
        context = CoachingContext(
            avatar=avatar,
            task_context=task_context,
            current_struggle=avatar.struggle_patterns[-1] if avatar.struggle_patterns else [],
            emotional_state=avatar.emotional_state,
            cognitive_load=avatar.cognitive_load,
            stress_level=avatar.stress_level,
            recent_performance=avatar.coaching_history[-5:] if avatar.coaching_history else [],
            coaching_history=avatar.coaching_history,
        )
        
        # Assess if intervention is needed
        intervention_needed = self._assess_intervention_need(context)
        
        if intervention_needed:
            coaching_action = self.provide_coaching(context)
            if coaching_action:
                avatar.receive_coaching(coaching_action.to_dict())
                self.intervention_history.append(coaching_action)
                self.total_interventions += 1
                self.last_intervention = datetime.now()
    
    def provide_coaching(self, context: CoachingContext) -> Optional[CoachingAction]:
        """
        Provide real-time coaching intervention.
        
        Args:
            context: Current coaching context
            
        Returns:
            CoachingAction if intervention is provided, None otherwise
        """
        # Check for crisis intervention first
        if self._requires_crisis_intervention(context):
            return self._provide_crisis_intervention(context)
        
        # Get expertise-based strategies
        expertise_strategies = self.get_expertise_strategies(context)
        
        # Get real-world insights
        real_world_insights = self.get_real_world_insights(context)
        
        # Combine and prioritize strategies
        combined_strategies = self._combine_strategies(expertise_strategies, real_world_insights)
        
        # Select best strategy for current context
        selected_strategy = self._select_optimal_strategy(combined_strategies, context)
        
        if not selected_strategy:
            return None
        
        # Create coaching action
        coaching_action = CoachingAction(
            action_id=str(uuid.uuid4()),
            coaching_type=self._determine_coaching_type(context),
            urgency=self._assess_urgency(context),
            strategy=selected_strategy["strategy"],
            specific_techniques=selected_strategy["techniques"],
            expected_outcomes=selected_strategy["expected_outcomes"],
            stress_reduction=selected_strategy.get("stress_reduction", 0.0),
            emotional_boost=selected_strategy.get("emotional_boost", 0.0),
            cognitive_support=selected_strategy.get("cognitive_support", 0.0),
            independence_building=selected_strategy.get("independence_building", 0.0),
        )
        
        return coaching_action
    
    def assess_burnout_risk(self, avatar: BaseAvatar) -> BurnoutRisk:
        """
        Evaluate if Avatar is approaching burnout and needs RRT intervention.
        
        Args:
            avatar: Avatar to assess
            
        Returns:
            BurnoutRisk assessment
        """
        # Get Avatar's burnout assessment
        avatar_burnout = avatar.assess_burnout_risk()
        
        # Enhance with Aide's expertise
        risk_factors = self._identify_risk_factors(avatar)
        early_warning_signs = self._detect_early_warning_signs(avatar)
        intervention_recommendations = self._generate_intervention_recommendations(avatar)
        
        # Determine if RRT activation is needed
        rrt_activation_needed = avatar_burnout["risk_level"] in ["high", "critical"]
        
        return BurnoutRisk(
            risk_level=avatar_burnout["risk_level"],
            risk_score=avatar_burnout["risk_score"],
            contributing_factors=risk_factors,
            early_warning_signs=early_warning_signs,
            intervention_recommendations=intervention_recommendations,
            rrt_activation_needed=rrt_activation_needed,
        )
    
    def track_intervention_effectiveness(self, action: CoachingAction, 
                                      avatar_result: TaskResult) -> None:
        """
        Track the effectiveness of coaching interventions.
        
        Args:
            action: The coaching action that was taken
            avatar_result: The Avatar's result after the intervention
        """
        # Determine if intervention was successful
        success_indicators = [
            avatar_result.success,
            avatar_result.quality_score > 0.7,
            len(avatar_result.struggle_indicators) < len(action.specific_techniques),
            avatar_result.emotional_state in ["confident", "relieved", "hopeful"],
        ]
        
        intervention_successful = sum(success_indicators) >= 2
        
        if intervention_successful:
            self.successful_interventions += 1
            self._record_success_pattern(action, avatar_result)
        else:
            self._record_failure_pattern(action, avatar_result)
        
        # Update strategy effectiveness
        self._update_strategy_effectiveness(action, intervention_successful)
    
    def get_coaching_effectiveness_metrics(self) -> Dict[str, Any]:
        """Get comprehensive coaching effectiveness metrics"""
        total_interventions = max(self.total_interventions, 1)
        
        return {
            "aide_id": self.aide_id,
            "expertise_area": self.expertise_area,
            "total_interventions": self.total_interventions,
            "successful_interventions": self.successful_interventions,
            "success_rate": self.successful_interventions / total_interventions,
            "crisis_interventions": self.crisis_interventions,
            "independence_achievements": self.independence_achievements,
            "average_intervention_frequency": self._calculate_average_intervention_frequency(),
            "strategy_effectiveness": self._get_strategy_effectiveness_summary(),
            "success_patterns": self.success_patterns,
            "failure_patterns": self.failure_patterns,
            "last_intervention": self.last_intervention.isoformat(),
        }
    
    # Private helper methods
    
    def _assess_intervention_need(self, context: CoachingContext) -> bool:
        """Assess if intervention is needed based on context"""
        # Check Avatar state
        if context.avatar.current_state in [AvatarState.STRUGGLING, AvatarState.BURNOUT_RISK]:
            return True
        
        # Check emotional state
        if context.emotional_state in ["frustrated", "overwhelmed", "defeated"]:
            return True
        
        # Check cognitive load
        if context.cognitive_load > 0.8:
            return True
        
        # Check stress level
        if context.stress_level > 0.7:
            return True
        
        # Check recent performance
        if len(context.recent_performance) >= 3:
            recent_failures = sum(1 for r in context.recent_performance[-3:] if not r.success)
            if recent_failures >= 2:
                return True
        
        return False
    
    def _requires_crisis_intervention(self, context: CoachingContext) -> bool:
        """Check if crisis intervention is needed"""
        return (context.avatar.current_state == AvatarState.BURNOUT_RISK or
                context.stress_level > 0.9 or
                context.emotional_state == "crisis")
    
    def _provide_crisis_intervention(self, context: CoachingContext) -> CoachingAction:
        """Provide crisis intervention using RRT foundation"""
        self.crisis_interventions += 1
        
        return CoachingAction(
            action_id=str(uuid.uuid4()),
            coaching_type=CoachingType.CRISIS,
            urgency=InterventionUrgency.CRITICAL,
            strategy="Crisis stabilization and immediate support",
            specific_techniques=[
                "Immediate stress reduction",
                "Emotional validation",
                "Task modification or removal",
                "Recovery protocol activation",
            ],
            expected_outcomes=[
                "Reduced immediate stress",
                "Stabilized emotional state",
                "Prevented burnout",
                "Initiated recovery process",
            ],
            stress_reduction=0.5,
            emotional_boost=0.3,
            cognitive_support=0.4,
        )
    
    def _combine_strategies(self, expertise_strategies: List[Dict[str, Any]], 
                          real_world_insights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Combine PhD expertise with real-world insights"""
        combined = []
        
        # Add expertise strategies
        for strategy in expertise_strategies:
            strategy["source"] = "phd_expertise"
            combined.append(strategy)
        
        # Add real-world insights
        for insight in real_world_insights:
            insight["source"] = "real_world"
            combined.append(insight)
        
        return combined
    
    def _select_optimal_strategy(self, strategies: List[Dict[str, Any]], 
                               context: CoachingContext) -> Optional[Dict[str, Any]]:
        """Select the best strategy for the current context"""
        if not strategies:
            return None
        
        # Score strategies based on context fit
        scored_strategies = []
        for strategy in strategies:
            score = self._score_strategy_fit(strategy, context)
            scored_strategies.append((score, strategy))
        
        # Return highest scoring strategy
        scored_strategies.sort(key=lambda x: x[0], reverse=True)
        return scored_strategies[0][1] if scored_strategies else None
    
    def _score_strategy_fit(self, strategy: Dict[str, Any], 
                          context: CoachingContext) -> float:
        """Score how well a strategy fits the current context"""
        score = 0.0
        
        # Base score
        score += 0.3
        
        # Source preference (real-world insights often more practical)
        if strategy.get("source") == "real_world":
            score += 0.2
        
        # Context matching
        if strategy.get("context_match", 0.0) > 0.5:
            score += 0.3
        
        # Effectiveness history
        effectiveness = strategy.get("effectiveness", 0.5)
        score += effectiveness * 0.2
        
        return score
    
    def _determine_coaching_type(self, context: CoachingContext) -> CoachingType:
        """Determine the type of coaching needed"""
        if context.avatar.current_state == AvatarState.BURNOUT_RISK:
            return CoachingType.CRISIS
        elif context.avatar.current_state == AvatarState.STRUGGLING:
            return CoachingType.REACTIVE
        elif context.avatar.current_state == AvatarState.LEARNING:
            return CoachingType.INDEPENDENCE_BUILDING
        else:
            return CoachingType.PREVENTIVE
    
    def _assess_urgency(self, context: CoachingContext) -> InterventionUrgency:
        """Assess the urgency of intervention needed"""
        if context.avatar.current_state == AvatarState.BURNOUT_RISK:
            return InterventionUrgency.CRITICAL
        elif context.stress_level > 0.8 or context.cognitive_load > 0.9:
            return InterventionUrgency.HIGH
        elif context.emotional_state in ["frustrated", "overwhelmed"]:
            return InterventionUrgency.MEDIUM
        else:
            return InterventionUrgency.LOW
    
    def _identify_risk_factors(self, avatar: BaseAvatar) -> List[str]:
        """Identify specific risk factors for burnout"""
        risk_factors = []
        
        if avatar.stress_level > 0.7:
            risk_factors.append("High stress level")
        
        if avatar.cognitive_load > 0.8:
            risk_factors.append("High cognitive load")
        
        if avatar.emotional_state in ["frustrated", "overwhelmed"]:
            risk_factors.append("Negative emotional state")
        
        recent_failures = self._count_recent_failures(avatar)
        if recent_failures > 3:
            risk_factors.append("Recent failure pattern")
        
        return risk_factors
    
    def _detect_early_warning_signs(self, avatar: BaseAvatar) -> List[str]:
        """Detect early warning signs of burnout"""
        warning_signs = []
        
        if avatar.burnout_risk_level > 0.5:
            warning_signs.append("Elevated burnout risk score")
        
        if avatar.emotional_state == "frustrated":
            warning_signs.append("Increased frustration")
        
        if avatar.cognitive_load > 0.7:
            warning_signs.append("High cognitive load")
        
        return warning_signs
    
    def _generate_intervention_recommendations(self, avatar: BaseAvatar) -> List[str]:
        """Generate specific intervention recommendations"""
        recommendations = []
        
        if avatar.stress_level > 0.7:
            recommendations.append("Implement stress reduction techniques")
        
        if avatar.cognitive_load > 0.8:
            recommendations.append("Reduce task complexity")
        
        if avatar.emotional_state in ["frustrated", "overwhelmed"]:
            recommendations.append("Provide emotional support and validation")
        
        return recommendations
    
    def _record_success_pattern(self, action: CoachingAction, result: TaskResult) -> None:
        """Record patterns that led to successful interventions"""
        pattern_key = f"{action.strategy}_{action.coaching_type.value}"
        
        if pattern_key not in self.success_patterns:
            self.success_patterns[pattern_key] = {
                "count": 0,
                "contexts": [],
                "techniques": [],
            }
        
        self.success_patterns[pattern_key]["count"] += 1
        self.success_patterns[pattern_key]["contexts"].append({
            "emotional_state": result.emotional_state,
            "cognitive_load": result.cognitive_load,
            "struggle_indicators": result.struggle_indicators,
        })
        self.success_patterns[pattern_key]["techniques"].extend(action.specific_techniques)
    
    def _record_failure_pattern(self, action: CoachingAction, result: TaskResult) -> None:
        """Record patterns that led to failed interventions"""
        pattern_key = f"{action.strategy}_{action.coaching_type.value}"
        
        if pattern_key not in self.failure_patterns:
            self.failure_patterns[pattern_key] = {
                "count": 0,
                "contexts": [],
                "techniques": [],
            }
        
        self.failure_patterns[pattern_key]["count"] += 1
        self.failure_patterns[pattern_key]["contexts"].append({
            "emotional_state": result.emotional_state,
            "cognitive_load": result.cognitive_load,
            "struggle_indicators": result.struggle_indicators,
        })
        self.failure_patterns[pattern_key]["techniques"].extend(action.specific_techniques)
    
    def _update_strategy_effectiveness(self, action: CoachingAction, successful: bool) -> None:
        """Update effectiveness tracking for strategies"""
        # This would update internal effectiveness metrics
        # Implementation depends on specific tracking needs
        pass
    
    def _get_strategy_effectiveness_summary(self) -> Dict[str, Any]:
        """Get summary of strategy effectiveness"""
        return {
            "most_effective_strategies": list(self.success_patterns.keys())[:5],
            "least_effective_strategies": list(self.failure_patterns.keys())[:5],
            "success_rate_by_type": self._calculate_success_rate_by_type(),
        }
    
    def _calculate_success_rate_by_type(self) -> Dict[str, float]:
        """Calculate success rate by coaching type"""
        # This would analyze intervention history by type
        # For now, return placeholder
        return {
            "preventive": 0.8,
            "reactive": 0.7,
            "crisis": 0.6,
            "recovery": 0.9,
            "independence_building": 0.75,
        }
    
    def _calculate_average_intervention_frequency(self) -> float:
        """Calculate average intervention frequency"""
        if self.total_interventions == 0:
            return 0.0
        
        time_span = datetime.now() - self.created_at
        return self.total_interventions / max(time_span.total_seconds() / 3600, 1)  # per hour
    
    def _count_recent_failures(self, avatar: BaseAvatar) -> int:
        """Count recent failures for the Avatar"""
        # This would analyze recent task results
        # For now, return placeholder
        return 0