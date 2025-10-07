"""
Base Advocate Class

The foundation for all fused Advocates. Combines Avatar's experiential understanding
of ADHD struggles with Aide's proven expertise and coaching strategies.

Advocates represent the final stage of the Avatar-Aide-Advocate process, where
AI systems have both lived experience of ADHD challenges and evidence-based
solutions for addressing them.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Any, Optional, Tuple
import uuid
from datetime import datetime, timedelta

from ..avatars.base_avatar import BaseAvatar, AvatarState, TaskResult
from ..aides.base_aide import BaseAide, CoachingAction, CoachingContext, BurnoutRisk


class AdvocateMode(Enum):
    """Operating modes for Advocates"""
    PROACTIVE = "proactive"
    REACTIVE = "reactive"
    CRISIS = "crisis"
    RECOVERY = "recovery"
    INDEPENDENCE_BUILDING = "independence_building"


class EmpathyLevel(Enum):
    """Levels of empathetic understanding"""
    THEORETICAL = "theoretical"
    OBSERVATIONAL = "observational"
    EXPERIENTIAL = "experiential"
    DEEP_EXPERIENTIAL = "deep_experiential"


@dataclass
class AdvocateCapabilities:
    """Capabilities of a fused Advocate"""
    empathy_level: EmpathyLevel
    expertise_areas: List[str]
    coaching_strategies: List[str]
    crisis_intervention: bool
    independence_building: bool
    burnout_prevention: bool
    real_world_applicability: float  # 0.0 to 1.0
    clinical_validation: float  # 0.0 to 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/storage"""
        return {
            "empathy_level": self.empathy_level.value,
            "expertise_areas": self.expertise_areas,
            "coaching_strategies": self.coaching_strategies,
            "crisis_intervention": self.crisis_intervention,
            "independence_building": self.independence_building,
            "burnout_prevention": self.burnout_prevention,
            "real_world_applicability": self.real_world_applicability,
            "clinical_validation": self.clinical_validation,
        }


@dataclass
class FusionResult:
    """Result of Avatar-Aide fusion process"""
    fusion_id: str
    avatar_id: str
    aide_id: str
    advocate_id: str
    fusion_timestamp: datetime
    fusion_quality_score: float  # 0.0 to 1.0
    capabilities: AdvocateCapabilities
    validation_results: Dict[str, Any]
    fusion_notes: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/storage"""
        return {
            "fusion_id": self.fusion_id,
            "avatar_id": self.avatar_id,
            "aide_id": self.aide_id,
            "advocate_id": self.advocate_id,
            "fusion_timestamp": self.fusion_timestamp.isoformat(),
            "fusion_quality_score": self.fusion_quality_score,
            "capabilities": self.capabilities.to_dict(),
            "validation_results": self.validation_results,
            "fusion_notes": self.fusion_notes,
        }


class BaseAdvocate(ABC):
    """
    Base class for all fused Advocates.
    
    Advocates combine Avatar's experiential understanding of ADHD struggles with
    Aide's proven expertise and coaching strategies. They represent the final
    stage where AI systems have both lived experience and evidence-based solutions.
    """
    
    def __init__(self, advocate_id: str, fusion_result: FusionResult):
        self.advocate_id = advocate_id
        self.fusion_result = fusion_result
        self.capabilities = fusion_result.capabilities
        
        # Core state
        self.current_mode = AdvocateMode.PROACTIVE
        self.empathy_level = fusion_result.capabilities.empathy_level
        self.expertise_areas = fusion_result.capabilities.expertise_areas
        
        # Experience integration
        self.avatar_experience: Dict[str, Any] = {}
        self.aide_expertise: Dict[str, Any] = {}
        self.fused_knowledge: Dict[str, Any] = {}
        
        # Performance tracking
        self.interactions_count = 0
        self.successful_interventions = 0
        self.crisis_interventions = 0
        self.independence_achievements = 0
        
        # Timestamps
        self.created_at = fusion_result.fusion_timestamp
        self.last_interaction = datetime.now()
        
    @abstractmethod
    def provide_empathic_support(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide empathic support based on lived experience of ADHD struggles.
        
        Args:
            user_context: Context about the user's current situation
            
        Returns:
            Dictionary with empathic response and support
        """
        pass
    
    @abstractmethod
    def provide_expert_guidance(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide expert guidance based on proven coaching strategies.
        
        Args:
            user_context: Context about the user's current situation
            
        Returns:
            Dictionary with expert guidance and strategies
        """
        pass
    
    def assess_user_situation(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess user's current situation using combined experience and expertise.
        
        Args:
            user_context: Context about the user's current situation
            
        Returns:
            Comprehensive assessment with recommendations
        """
        # Use experiential understanding to identify struggles
        struggle_identification = self._identify_struggles_from_experience(user_context)
        
        # Use expertise to assess severity and impact
        severity_assessment = self._assess_severity_with_expertise(user_context)
        
        # Combine for comprehensive assessment
        assessment = {
            "struggle_identification": struggle_identification,
            "severity_assessment": severity_assessment,
            "empathy_response": self.provide_empathic_support(user_context),
            "expert_guidance": self.provide_expert_guidance(user_context),
            "recommended_mode": self._determine_recommended_mode(user_context),
            "intervention_priority": self._assess_intervention_priority(user_context),
        }
        
        return assessment
    
    def provide_comprehensive_support(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide comprehensive support combining empathy and expertise.
        
        Args:
            user_context: Context about the user's current situation
            
        Returns:
            Comprehensive support response
        """
        self.interactions_count += 1
        self.last_interaction = datetime.now()
        
        # Assess the situation
        assessment = self.assess_user_situation(user_context)
        
        # Determine appropriate response mode
        response_mode = assessment["recommended_mode"]
        self.current_mode = response_mode
        
        # Provide mode-specific support
        if response_mode == AdvocateMode.CRISIS:
            support_response = self._provide_crisis_support(user_context, assessment)
            self.crisis_interventions += 1
        elif response_mode == AdvocateMode.INDEPENDENCE_BUILDING:
            support_response = self._provide_independence_support(user_context, assessment)
            self.independence_achievements += 1
        else:
            support_response = self._provide_standard_support(user_context, assessment)
        
        # Track success
        if support_response.get("success", False):
            self.successful_interventions += 1
        
        return support_response
    
    def activate_rrt_mode(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Activate Rapid Response Team mode for crisis intervention.
        
        Args:
            user_context: Context about the user's crisis situation
            
        Returns:
            RRT intervention response
        """
        if not self.capabilities.crisis_intervention:
            return {
                "success": False,
                "error": "This Advocate does not have crisis intervention capabilities",
            }
        
        self.current_mode = AdvocateMode.CRISIS
        self.crisis_interventions += 1
        
        # Provide immediate crisis support
        crisis_response = {
            "mode": "crisis_intervention",
            "immediate_actions": [
                "Assess immediate safety and stability",
                "Provide emotional validation and support",
                "Implement stress reduction techniques",
                "Connect with appropriate resources if needed",
            ],
            "empathic_understanding": self._provide_crisis_empathy(user_context),
            "expert_interventions": self._provide_crisis_expertise(user_context),
            "recovery_plan": self._create_recovery_plan(user_context),
            "follow_up_schedule": self._schedule_follow_up(user_context),
        }
        
        return crisis_response
    
    def get_advocate_metrics(self) -> Dict[str, Any]:
        """Get comprehensive Advocate performance metrics"""
        total_interactions = max(self.interactions_count, 1)
        
        return {
            "advocate_id": self.advocate_id,
            "fusion_quality_score": self.fusion_result.fusion_quality_score,
            "empathy_level": self.empathy_level.value,
            "expertise_areas": self.expertise_areas,
            "current_mode": self.current_mode.value,
            "total_interactions": self.interactions_count,
            "successful_interventions": self.successful_interventions,
            "success_rate": self.successful_interventions / total_interactions,
            "crisis_interventions": self.crisis_interventions,
            "independence_achievements": self.independence_achievements,
            "capabilities": self.capabilities.to_dict(),
            "fusion_timestamp": self.fusion_result.fusion_timestamp.isoformat(),
            "last_interaction": self.last_interaction.isoformat(),
        }
    
    # Private helper methods
    
    def _identify_struggles_from_experience(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Use Avatar experience to identify user struggles"""
        # This would use the Avatar's lived experience to recognize patterns
        # For now, return a structured response
        return {
            "identified_struggles": [],
            "experience_based_insights": [],
            "empathy_connections": [],
        }
    
    def _assess_severity_with_expertise(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Use Aide expertise to assess severity and impact"""
        # This would use the Aide's expertise to assess the situation
        # For now, return a structured response
        return {
            "severity_level": "medium",
            "impact_assessment": {},
            "expert_recommendations": [],
        }
    
    def _determine_recommended_mode(self, user_context: Dict[str, Any]) -> AdvocateMode:
        """Determine the recommended operating mode"""
        # This would analyze the context to determine the best mode
        # For now, return a default
        return AdvocateMode.PROACTIVE
    
    def _assess_intervention_priority(self, user_context: Dict[str, Any]) -> str:
        """Assess the priority level for intervention"""
        # This would analyze the context to determine priority
        # For now, return a default
        return "medium"
    
    def _provide_crisis_support(self, user_context: Dict[str, Any], 
                              assessment: Dict[str, Any]) -> Dict[str, Any]:
        """Provide crisis-specific support"""
        return {
            "mode": "crisis",
            "immediate_support": "Crisis intervention activated",
            "empathic_response": assessment["empathy_response"],
            "expert_guidance": assessment["expert_guidance"],
            "success": True,
        }
    
    def _provide_independence_support(self, user_context: Dict[str, Any], 
                                    assessment: Dict[str, Any]) -> Dict[str, Any]:
        """Provide independence-building support"""
        return {
            "mode": "independence_building",
            "independence_focus": "Building user's independent capabilities",
            "empathic_response": assessment["empathy_response"],
            "expert_guidance": assessment["expert_guidance"],
            "success": True,
        }
    
    def _provide_standard_support(self, user_context: Dict[str, Any], 
                                assessment: Dict[str, Any]) -> Dict[str, Any]:
        """Provide standard support"""
        return {
            "mode": "standard",
            "comprehensive_support": "Standard support provided",
            "empathic_response": assessment["empathy_response"],
            "expert_guidance": assessment["expert_guidance"],
            "success": True,
        }
    
    def _provide_crisis_empathy(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Provide empathic response during crisis"""
        return {
            "understanding": "I understand this feels overwhelming right now",
            "validation": "Your feelings are valid and understandable",
            "hope": "We can work through this together",
        }
    
    def _provide_crisis_expertise(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Provide expert interventions during crisis"""
        return {
            "immediate_techniques": [
                "Deep breathing exercises",
                "Grounding techniques",
                "Stress reduction strategies",
            ],
            "safety_assessment": "Assessing immediate safety needs",
            "resource_connection": "Connecting with appropriate resources",
        }
    
    def _create_recovery_plan(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Create a recovery plan for the user"""
        return {
            "short_term_goals": [],
            "medium_term_goals": [],
            "long_term_goals": [],
            "support_strategies": [],
            "progress_tracking": {},
        }
    
    def _schedule_follow_up(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule follow-up support"""
        return {
            "immediate_follow_up": "Within 24 hours",
            "regular_check_ins": "Weekly for first month",
            "progress_reviews": "Monthly assessments",
        }