"""
Base Avatar Class

The foundation for all ADHD trait Avatars. Implements core behavior patterns,
state management, and learning progression tracking.

Each Avatar embodies a specific ADHD trait and experiences authentic struggles
in simulation environments, learning through repeated attempts and gradual
improvement with Aide support.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Any, Optional, Tuple
import uuid
from datetime import datetime, timedelta


class AvatarState(Enum):
    """Current state of the Avatar in the simulation"""
    IDLE = "idle"
    ATTEMPTING_TASK = "attempting_task"
    STRUGGLING = "struggling"
    RECEIVING_COACHING = "receiving_coaching"
    LEARNING = "learning"
    INDEPENDENT = "independent"
    BURNOUT_RISK = "burnout_risk"
    BURNOUT = "burnout"


class TaskDifficulty(Enum):
    """Difficulty levels for tasks"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXTREME = "extreme"


@dataclass
class TaskResult:
    """Result of an Avatar's task attempt"""
    success: bool
    completion_time: Optional[timedelta]
    quality_score: float  # 0.0 to 1.0
    struggle_indicators: List[str]
    aide_interventions: List[str]
    emotional_state: str
    cognitive_load: float  # 0.0 to 1.0
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/storage"""
        return {
            "success": self.success,
            "completion_time_seconds": self.completion_time.total_seconds() if self.completion_time else None,
            "quality_score": self.quality_score,
            "struggle_indicators": self.struggle_indicators,
            "aide_interventions": self.aide_interventions,
            "emotional_state": self.emotional_state,
            "cognitive_load": self.cognitive_load,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class LearningProgress:
    """Track Avatar's learning progression"""
    task_type: str
    attempts: int = 0
    successes: int = 0
    total_coaching_sessions: int = 0
    independence_milestones: List[datetime] = field(default_factory=list)
    current_independence_level: float = 0.0  # 0.0 to 1.0
    last_improvement: Optional[datetime] = None
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate for this task type"""
        if self.attempts == 0:
            return 0.0
        return self.successes / self.attempts
    
    @property
    def is_independent(self) -> bool:
        """Check if Avatar has achieved independence for this task"""
        return self.current_independence_level >= 0.8  # 80% independence threshold


class BaseAvatar(ABC):
    """
    Base class for all ADHD trait Avatars.
    
    Each Avatar embodies a specific ADHD trait and experiences authentic struggles
    in simulation environments. They learn through repeated attempts, failures,
    and gradual improvement with Aide support.
    """
    
    def __init__(self, avatar_id: str, trait_config: Dict[str, Any]):
        self.avatar_id = avatar_id
        self.trait_config = trait_config
        self.trait_name = trait_config.get("trait_name", "unknown")
        
        # Core state
        self.current_state = AvatarState.IDLE
        self.emotional_state = "neutral"
        self.cognitive_load = 0.0
        self.stress_level = 0.0
        
        # Learning tracking
        self.learning_progress: Dict[str, LearningProgress] = {}
        self.struggle_patterns: List[Dict[str, Any]] = []
        self.coaching_history: List[Dict[str, Any]] = []
        
        # Performance metrics
        self.total_tasks_attempted = 0
        self.total_tasks_completed = 0
        self.total_coaching_sessions = 0
        self.burnout_risk_level = 0.0
        
        # Timestamps
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        
    @abstractmethod
    def get_adhd_trait_impact(self, task_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate how this Avatar's specific ADHD trait affects task performance.
        
        Args:
            task_context: Context about the current task and environment
            
        Returns:
            Dictionary with trait impact details (difficulty_modifier, 
            struggle_indicators, etc.)
        """
        pass
    
    @abstractmethod
    def simulate_struggle(self, task_context: Dict[str, Any]) -> List[str]:
        """
        Simulate authentic struggle patterns for this ADHD trait.
        
        Args:
            task_context: Context about the current task
            
        Returns:
            List of struggle indicators (e.g., ["lost_focus", "forgot_instructions"])
        """
        pass
    
    def attempt_task(self, task_context: Dict[str, Any]) -> TaskResult:
        """
        Attempt a task with ADHD trait affecting performance.
        
        Args:
            task_context: Context about the task to attempt
            
        Returns:
            TaskResult with success/failure and detailed metrics
        """
        self.current_state = AvatarState.ATTEMPTING_TASK
        self.last_activity = datetime.now()
        self.total_tasks_attempted += 1
        
        # Get trait impact
        trait_impact = self.get_adhd_trait_impact(task_context)
        
        # Simulate struggle
        struggle_indicators = self.simulate_struggle(task_context)
        
        # Calculate success probability based on trait impact
        base_success_rate = task_context.get("base_success_rate", 0.5)
        difficulty_modifier = trait_impact.get("difficulty_modifier", 1.0)
        adjusted_success_rate = base_success_rate / difficulty_modifier
        
        # Determine success
        import random
        success = random.random() < adjusted_success_rate
        
        # Calculate quality score
        quality_score = self._calculate_quality_score(success, trait_impact, struggle_indicators)
        
        # Update emotional state based on result
        self._update_emotional_state(success, struggle_indicators)
        
        # Update cognitive load
        self._update_cognitive_load(task_context, trait_impact)
        
        # Create result
        result = TaskResult(
            success=success,
            completion_time=self._calculate_completion_time(task_context, trait_impact),
            quality_score=quality_score,
            struggle_indicators=struggle_indicators,
            aide_interventions=[],  # Will be populated by Aide
            emotional_state=self.emotional_state,
            cognitive_load=self.cognitive_load,
        )
        
        # Update learning progress
        self._update_learning_progress(task_context, result)
        
        # Update state
        if success:
            self.current_state = AvatarState.LEARNING
            self.total_tasks_completed += 1
        else:
            self.current_state = AvatarState.STRUGGLING
            
        return result
    
    def receive_coaching(self, coaching_action: Dict[str, Any]) -> None:
        """
        Receive coaching intervention from Aide.
        
        Args:
            coaching_action: Coaching intervention details
        """
        self.current_state = AvatarState.RECEIVING_COACHING
        self.total_coaching_sessions += 1
        
        # Record coaching session
        self.coaching_history.append({
            "timestamp": datetime.now(),
            "coaching_action": coaching_action,
            "avatar_state_before": self.current_state.value,
            "emotional_state": self.emotional_state,
            "cognitive_load": self.cognitive_load,
        })
        
        # Apply coaching effects
        self._apply_coaching_effects(coaching_action)
        
        # Update state
        self.current_state = AvatarState.LEARNING
    
    def get_independence_level(self, task_type: Optional[str] = None) -> float:
        """
        Get current independence level for specific task type or overall.
        
        Args:
            task_type: Specific task type, or None for overall independence
            
        Returns:
            Independence level from 0.0 to 1.0
        """
        if task_type:
            progress = self.learning_progress.get(task_type)
            if progress:
                return progress.current_independence_level
            return 0.0
        
        # Calculate overall independence
        if not self.learning_progress:
            return 0.0
            
        total_independence = sum(p.current_independence_level for p in self.learning_progress.values())
        return total_independence / len(self.learning_progress)
    
    def assess_burnout_risk(self) -> Dict[str, Any]:
        """
        Assess current burnout risk level.
        
        Returns:
            Dictionary with burnout risk assessment
        """
        # Calculate risk factors
        recent_failures = self._count_recent_failures()
        coaching_frequency = self._calculate_coaching_frequency()
        stress_accumulation = self._calculate_stress_accumulation()
        
        # Combine factors
        risk_score = (recent_failures * 0.3 + 
                     coaching_frequency * 0.3 + 
                     stress_accumulation * 0.4)
        
        self.burnout_risk_level = min(risk_score, 1.0)
        
        # Determine risk level
        if self.burnout_risk_level >= 0.8:
            risk_level = "critical"
            self.current_state = AvatarState.BURNOUT_RISK
        elif self.burnout_risk_level >= 0.6:
            risk_level = "high"
        elif self.burnout_risk_level >= 0.4:
            risk_level = "medium"
        else:
            risk_level = "low"
            
        return {
            "risk_level": risk_level,
            "risk_score": self.burnout_risk_level,
            "recent_failures": recent_failures,
            "coaching_frequency": coaching_frequency,
            "stress_accumulation": stress_accumulation,
            "recommendations": self._get_burnout_prevention_recommendations(),
        }
    
    def get_state_summary(self) -> Dict[str, Any]:
        """Get comprehensive state summary for logging/monitoring"""
        return {
            "avatar_id": self.avatar_id,
            "trait_name": self.trait_name,
            "current_state": self.current_state.value,
            "emotional_state": self.emotional_state,
            "cognitive_load": self.cognitive_load,
            "stress_level": self.stress_level,
            "burnout_risk_level": self.burnout_risk_level,
            "overall_independence": self.get_independence_level(),
            "total_tasks_attempted": self.total_tasks_attempted,
            "total_tasks_completed": self.total_tasks_completed,
            "total_coaching_sessions": self.total_coaching_sessions,
            "success_rate": self.total_tasks_completed / max(self.total_tasks_attempted, 1),
            "learning_progress": {k: v.__dict__ for k, v in self.learning_progress.items()},
            "last_activity": self.last_activity.isoformat(),
        }
    
    # Private helper methods
    
    def _calculate_quality_score(self, success: bool, trait_impact: Dict[str, Any], 
                                struggle_indicators: List[str]) -> float:
        """Calculate quality score for task completion"""
        if not success:
            return 0.0
            
        base_quality = 0.8
        struggle_penalty = len(struggle_indicators) * 0.1
        trait_penalty = trait_impact.get("quality_modifier", 0.0)
        
        return max(0.0, min(1.0, base_quality - struggle_penalty - trait_penalty))
    
    def _calculate_completion_time(self, task_context: Dict[str, Any], 
                                 trait_impact: Dict[str, Any]) -> timedelta:
        """Calculate task completion time with trait effects"""
        base_time = task_context.get("expected_duration", timedelta(minutes=10))
        time_modifier = trait_impact.get("time_modifier", 1.0)
        
        # Add randomness for realism
        import random
        random_factor = random.uniform(0.8, 1.2)
        
        return base_time * time_modifier * random_factor
    
    def _update_emotional_state(self, success: bool, struggle_indicators: List[str]) -> None:
        """Update emotional state based on task result"""
        if success:
            if len(struggle_indicators) == 0:
                self.emotional_state = "confident"
            else:
                self.emotional_state = "relieved"
        else:
            if len(struggle_indicators) > 3:
                self.emotional_state = "frustrated"
            else:
                self.emotional_state = "disappointed"
    
    def _update_cognitive_load(self, task_context: Dict[str, Any], 
                             trait_impact: Dict[str, Any]) -> None:
        """Update cognitive load based on task and trait impact"""
        base_load = task_context.get("cognitive_demand", 0.5)
        trait_load = trait_impact.get("cognitive_load_modifier", 0.0)
        
        self.cognitive_load = min(1.0, base_load + trait_load)
    
    def _update_learning_progress(self, task_context: Dict[str, Any], 
                                result: TaskResult) -> None:
        """Update learning progress tracking"""
        task_type = task_context.get("task_type", "unknown")
        
        if task_type not in self.learning_progress:
            self.learning_progress[task_type] = LearningProgress(task_type=task_type)
        
        progress = self.learning_progress[task_type]
        progress.attempts += 1
        
        if result.success:
            progress.successes += 1
            
        # Update independence level
        if result.success and len(result.aide_interventions) == 0:
            # Independent success
            progress.independence_milestones.append(datetime.now())
            progress.current_independence_level = min(1.0, 
                progress.current_independence_level + 0.1)
        elif result.success:
            # Success with coaching
            progress.current_independence_level = min(1.0,
                progress.current_independence_level + 0.05)
        
        progress.last_improvement = datetime.now()
    
    def _apply_coaching_effects(self, coaching_action: Dict[str, Any]) -> None:
        """Apply effects of coaching intervention"""
        # Reduce stress
        stress_reduction = coaching_action.get("stress_reduction", 0.0)
        self.stress_level = max(0.0, self.stress_level - stress_reduction)
        
        # Improve emotional state
        emotional_boost = coaching_action.get("emotional_boost", 0.0)
        if emotional_boost > 0:
            if self.emotional_state in ["frustrated", "disappointed"]:
                self.emotional_state = "hopeful"
            elif self.emotional_state == "hopeful":
                self.emotional_state = "confident"
    
    def _count_recent_failures(self) -> float:
        """Count recent failures for burnout risk assessment"""
        # This would analyze recent task results
        # For now, return a placeholder
        return 0.0
    
    def _calculate_coaching_frequency(self) -> float:
        """Calculate recent coaching frequency"""
        # This would analyze recent coaching sessions
        # For now, return a placeholder
        return 0.0
    
    def _calculate_stress_accumulation(self) -> float:
        """Calculate accumulated stress level"""
        return self.stress_level
    
    def _get_burnout_prevention_recommendations(self) -> List[str]:
        """Get recommendations for preventing burnout"""
        recommendations = []
        
        if self.burnout_risk_level > 0.6:
            recommendations.append("Reduce task difficulty")
            recommendations.append("Increase break frequency")
            recommendations.append("Focus on emotional support")
        
        if self.stress_level > 0.7:
            recommendations.append("Implement stress reduction techniques")
            recommendations.append("Consider task modification")
        
        return recommendations