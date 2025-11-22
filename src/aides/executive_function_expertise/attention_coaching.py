"""
Attention Coaching Expertise

PhD-level expertise and coaching strategies for sustained attention and focus
management. Combines academic research with real-world success stories to
provide evidence-based coaching interventions.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from ..base_aide import BaseAide, CoachingContext, CoachingAction, CoachingType, InterventionUrgency


class AttentionCoaching(BaseAide):
    """
    Aide specialized in coaching sustained attention and focus management.
    
    This Aide combines PhD-level research on attention deficit with real-world
    strategies from successful ADHD individuals to provide effective coaching
    interventions for attention-related struggles.
    """
    
    def __init__(self, aide_id: str, expertise_config: Dict[str, Any]):
        super().__init__(aide_id, expertise_config)
        
        # Attention-specific expertise
        self.attention_techniques = expertise_config.get("attention_techniques", [])
        self.distraction_management = expertise_config.get("distraction_management", [])
        self.focus_building_strategies = expertise_config.get("focus_building_strategies", [])
        self.mental_endurance_training = expertise_config.get("mental_endurance_training", [])
        
        # Evidence-based strategies
        self.pomodoro_technique = {
            "description": "Work in 25-minute focused intervals with 5-minute breaks",
            "effectiveness": 0.8,
            "applicable_contexts": ["sustained_work", "study_sessions", "repetitive_tasks"],
            "implementation_steps": [
                "Set timer for 25 minutes",
                "Focus solely on the task",
                "Take 5-minute break when timer rings",
                "Repeat cycle 4 times",
                "Take longer 15-30 minute break"
            ]
        }
        
        self.mindfulness_attention_training = {
            "description": "Mindfulness-based attention training to improve focus",
            "effectiveness": 0.7,
            "applicable_contexts": ["attention_lapses", "distraction_episodes", "mental_fatigue"],
            "implementation_steps": [
                "Notice when attention wanders",
                "Gently redirect attention back to task",
                "Practice non-judgmental awareness",
                "Use breath as anchor point",
                "Gradually extend focus periods"
            ]
        }
        
        self.environmental_optimization = {
            "description": "Optimize environment to minimize distractions",
            "effectiveness": 0.9,
            "applicable_contexts": ["high_distraction", "focus_difficulties", "task_setup"],
            "implementation_steps": [
                "Remove visual distractions",
                "Use noise-cancelling headphones",
                "Organize workspace for efficiency",
                "Set up dedicated focus space",
                "Eliminate digital distractions"
            ]
        }
        
        self.task_chunking = {
            "description": "Break large tasks into smaller, manageable chunks",
            "effectiveness": 0.8,
            "applicable_contexts": ["overwhelming_tasks", "task_initiation", "sustained_work"],
            "implementation_steps": [
                "Identify the main task",
                "Break into 15-30 minute chunks",
                "Focus on one chunk at a time",
                "Take breaks between chunks",
                "Celebrate completion of each chunk"
            ]
        }
        
        self.attention_anchoring = {
            "description": "Use specific techniques to anchor and maintain attention",
            "effectiveness": 0.7,
            "applicable_contexts": ["attention_lapses", "focus_recovery", "sustained_attention"],
            "implementation_steps": [
                "Choose an attention anchor (breath, task, object)",
                "Return to anchor when mind wanders",
                "Practice gentle redirection",
                "Build anchor strength over time",
                "Use anchor during challenging moments"
            ]
        }
    
    def get_expertise_strategies(self, context: CoachingContext) -> List[Dict[str, Any]]:
        """
        Get PhD-level expertise strategies for attention coaching.
        
        Args:
            context: Current coaching context
            
        Returns:
            List of evidence-based attention coaching strategies
        """
        strategies = []
        
        # Analyze current attention struggles
        attention_issues = self._analyze_attention_issues(context)
        
        # Select appropriate strategies based on issues
        if "sustained_attention" in attention_issues:
            strategies.append(self.pomodoro_technique)
            strategies.append(self.task_chunking)
        
        if "distraction" in attention_issues:
            strategies.append(self.environmental_optimization)
            strategies.append(self.mindfulness_attention_training)
        
        if "focus_recovery" in attention_issues:
            strategies.append(self.attention_anchoring)
            strategies.append(self.mindfulness_attention_training)
        
        if "mental_fatigue" in attention_issues:
            strategies.append(self._get_fatigue_management_strategy())
        
        # Add context-specific strategies
        strategies.extend(self._get_context_specific_strategies(context))
        
        return strategies
    
    def get_real_world_insights(self, context: CoachingContext) -> List[Dict[str, Any]]:
        """
        Get real-world insights from successful ADHD individuals.
        
        Args:
            context: Current coaching context
            
        Returns:
            List of community wisdom and success stories
        """
        insights = []
        
        # Success story: Pomodoro technique adaptation
        insights.append({
            "source": "real_world",
            "strategy": "Adapted Pomodoro for ADHD",
            "description": "Use shorter work periods (15-20 min) with longer breaks (10-15 min)",
            "effectiveness": 0.9,
            "context_match": 0.8,
            "techniques": [
                "Start with 15-minute work periods",
                "Take 10-minute active breaks",
                "Gradually increase work period length",
                "Adjust based on daily energy levels",
                "Use physical movement during breaks"
            ],
            "expected_outcomes": [
                "Improved sustained attention",
                "Reduced mental fatigue",
                "Better task completion rates",
                "Increased work satisfaction"
            ],
            "stress_reduction": 0.3,
            "emotional_boost": 0.2,
            "cognitive_support": 0.4,
            "independence_building": 0.3
        })
        
        # Success story: Environmental customization
        insights.append({
            "source": "real_world",
            "strategy": "Personalized Focus Environment",
            "description": "Create a highly personalized workspace that works for individual attention needs",
            "effectiveness": 0.95,
            "context_match": 0.7,
            "techniques": [
                "Experiment with different lighting (natural, warm, cool)",
                "Find optimal noise level (silence, white noise, music)",
                "Use fidget tools for restless energy",
                "Set up visual reminders and cues",
                "Create ritual for entering focus mode"
            ],
            "expected_outcomes": [
                "Significantly reduced distractions",
                "Faster focus achievement",
                "Longer sustained attention periods",
                "Improved task engagement"
            ],
            "stress_reduction": 0.4,
            "emotional_boost": 0.3,
            "cognitive_support": 0.5,
            "independence_building": 0.4
        })
        
        # Success story: Attention recovery techniques
        insights.append({
            "source": "real_world",
            "strategy": "Gentle Attention Recovery",
            "description": "Use gentle, non-judgmental techniques to recover focus after lapses",
            "effectiveness": 0.8,
            "context_match": 0.9,
            "techniques": [
                "Notice attention lapse without self-criticism",
                "Take 3 deep breaths to reset",
                "Use a physical anchor (touch desk, feel feet)",
                "Whisper the task name to refocus",
                "Start with easiest part of task"
            ],
            "expected_outcomes": [
                "Faster focus recovery",
                "Reduced frustration with lapses",
                "Improved self-compassion",
                "Better overall attention management"
            ],
            "stress_reduction": 0.5,
            "emotional_boost": 0.4,
            "cognitive_support": 0.3,
            "independence_building": 0.5
        })
        
        return insights
    
    def _analyze_attention_issues(self, context: CoachingContext) -> List[str]:
        """Analyze specific attention issues from context"""
        issues = []
        
        # Check struggle indicators
        if hasattr(context.avatar, 'struggle_patterns') and context.avatar.struggle_patterns:
            recent_struggles = context.avatar.struggle_patterns[-1] if context.avatar.struggle_patterns else {}
            
            if "attention_lapse" in recent_struggles:
                issues.append("sustained_attention")
            
            if "environmental_distraction" in recent_struggles:
                issues.append("distraction")
            
            if "focus_recovery_difficulty" in recent_struggles:
                issues.append("focus_recovery")
            
            if "mental_fatigue" in recent_struggles:
                issues.append("mental_fatigue")
        
        # Check cognitive load
        if context.cognitive_load > 0.8:
            issues.append("cognitive_overload")
        
        # Check emotional state
        if context.emotional_state in ["frustrated", "overwhelmed"]:
            issues.append("emotional_interference")
        
        return issues
    
    def _get_fatigue_management_strategy(self) -> Dict[str, Any]:
        """Get strategy for managing mental fatigue"""
        return {
            "description": "Mental fatigue management and recovery techniques",
            "effectiveness": 0.8,
            "applicable_contexts": ["mental_fatigue", "cognitive_overload", "sustained_effort"],
            "implementation_steps": [
                "Recognize early fatigue signals",
                "Take proactive micro-breaks (2-3 minutes)",
                "Use different types of breaks (physical, mental, sensory)",
                "Practice energy management throughout day",
                "Build mental endurance gradually"
            ],
            "techniques": [
                "Micro-break protocol",
                "Energy level monitoring",
                "Task switching for variety",
                "Physical movement breaks",
                "Sensory reset techniques"
            ],
            "expected_outcomes": [
                "Reduced mental fatigue",
                "Improved sustained performance",
                "Better energy management",
                "Increased work capacity"
            ]
        }
    
    def _get_context_specific_strategies(self, context: CoachingContext) -> List[Dict[str, Any]]:
        """Get strategies specific to the current context"""
        strategies = []
        
        # Task-specific strategies
        task_type = context.task_context.get("task_type", "unknown")
        
        if task_type == "repetitive":
            strategies.append({
                "description": "Make repetitive tasks more engaging",
                "techniques": [
                    "Add variety to task execution",
                    "Use gamification elements",
                    "Set mini-goals and rewards",
                    "Change environment periodically",
                    "Use different approaches to same task"
                ],
                "effectiveness": 0.7
            })
        
        elif task_type == "complex":
            strategies.append({
                "description": "Break down complex tasks for better attention",
                "techniques": [
                    "Create detailed task breakdown",
                    "Focus on one component at a time",
                    "Use visual organization tools",
                    "Set clear milestones",
                    "Take breaks between components"
                ],
                "effectiveness": 0.8
            })
        
        return strategies