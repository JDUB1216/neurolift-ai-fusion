"""
Tests for BaseAvatar class and Avatar system components.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from src.avatars.base_avatar import (
    BaseAvatar,
    AvatarState,
    TaskResult,
    LearningProgress,
    TaskDifficulty,
)


class TestAvatar(BaseAvatar):
    """Test implementation of BaseAvatar for testing"""
    
    def get_adhd_trait_impact(self, task_context):
        return {
            "difficulty_modifier": 1.5,
            "struggle_indicators": ["test_struggle"],
            "quality_modifier": 0.1,
            "time_modifier": 1.2,
            "cognitive_load_modifier": 0.2,
        }
    
    def simulate_struggle(self, task_context):
        return ["test_struggle", "attention_lapse"]


class TestBaseAvatar:
    """Test cases for BaseAvatar class"""
    
    def test_avatar_initialization(self):
        """Test Avatar initialization with proper configuration"""
        config = {
            "trait_name": "test_trait",
            "initial_state": {"emotional_state": "neutral"}
        }
        
        avatar = TestAvatar("test_avatar_001", config)
        
        assert avatar.avatar_id == "test_avatar_001"
        assert avatar.trait_name == "test_trait"
        assert avatar.current_state == AvatarState.IDLE
        assert avatar.emotional_state == "neutral"
        assert avatar.cognitive_load == 0.0
        assert avatar.stress_level == 0.0
        assert avatar.total_tasks_attempted == 0
        assert avatar.total_tasks_completed == 0
    
    def test_avatar_state_transitions(self):
        """Test Avatar state transitions during task attempts"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)
        
        # Initial state
        assert avatar.current_state == AvatarState.IDLE
        
        # Task attempt
        task_context = {"task_type": "test_task", "base_success_rate": 0.8}
        result = avatar.attempt_task(task_context)
        
        # Should be in learning or struggling state
        assert avatar.current_state in [AvatarState.LEARNING, AvatarState.STRUGGLING]
        assert avatar.total_tasks_attempted == 1
    
    def test_task_attempt_with_trait_impact(self):
        """Test task attempt with ADHD trait affecting performance"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)
        
        task_context = {
            "task_type": "test_task",
            "base_success_rate": 0.8,
            "expected_duration": timedelta(minutes=10),
            "cognitive_demand": 0.6
        }
        
        result = avatar.attempt_task(task_context)
        
        assert isinstance(result, TaskResult)
        assert result.struggle_indicators == ["test_struggle", "attention_lapse"]
        assert result.emotional_state in ["confident", "relieved", "frustrated", "disappointed"]
        assert 0.0 <= result.quality_score <= 1.0
        assert 0.0 <= result.cognitive_load <= 1.0
    
    def test_coaching_reception(self):
        """Test Avatar receiving coaching interventions"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)

        # Option 1: Set initial stress to test reduction
        avatar.stress_level = 0.5

        coaching_action = {
            "strategy": "test_strategy",
            "stress_reduction": 0.3,
            "emotional_boost": 0.2
        }

        initial_stress = avatar.stress_level
        initial_emotional_state = avatar.emotional_state

        avatar.receive_coaching(coaching_action)

        assert avatar.current_state == AvatarState.LEARNING
        assert avatar.total_coaching_sessions == 1

        # Option 2 & 3: Use <= to handle edge cases, and verify reduction when stress > 0
        assert avatar.stress_level <= initial_stress
        if initial_stress > 0:
            assert avatar.stress_level < initial_stress
        assert len(avatar.coaching_history) == 1
    
    def test_learning_progress_tracking(self):
        """Test learning progress tracking for different task types"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)
        
        # First task attempt
        task_context = {"task_type": "focus_task", "base_success_rate": 0.5}
        result1 = avatar.attempt_task(task_context)
        
        # Check learning progress was created
        assert "focus_task" in avatar.learning_progress
        progress = avatar.learning_progress["focus_task"]
        assert progress.attempts == 1
        assert progress.task_type == "focus_task"
        
        # Second successful attempt
        with patch('random.random', return_value=0.1):  # Force success
            result2 = avatar.attempt_task(task_context)
        
        progress = avatar.learning_progress["focus_task"]
        assert progress.attempts == 2
        assert progress.successes == 1
        assert progress.success_rate == 0.5
    
    def test_independence_level_calculation(self):
        """Test independence level calculation"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)
        
        # No learning progress yet
        assert avatar.get_independence_level() == 0.0
        
        # Add some learning progress
        task_context = {"task_type": "test_task", "base_success_rate": 0.8}
        
        # Simulate multiple successful attempts to build independence
        with patch('random.random', return_value=0.1):  # Force success
            for _ in range(5):
                avatar.attempt_task(task_context)
        
        independence = avatar.get_independence_level("test_task")
        assert independence > 0.0
        assert independence <= 1.0
    
    def test_burnout_risk_assessment(self):
        """Test burnout risk assessment"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)
        
        # Set high stress level
        avatar.stress_level = 0.8
        
        burnout_assessment = avatar.assess_burnout_risk()
        
        assert "risk_level" in burnout_assessment
        assert "risk_score" in burnout_assessment
        assert "recent_failures" in burnout_assessment
        assert "coaching_frequency" in burnout_assessment
        assert "stress_accumulation" in burnout_assessment
        assert "recommendations" in burnout_assessment
        
        assert 0.0 <= burnout_assessment["risk_score"] <= 1.0
        assert burnout_assessment["risk_level"] in ["low", "medium", "high", "critical"]
    
    def test_state_summary(self):
        """Test comprehensive state summary generation"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)
        
        # Perform some actions
        task_context = {"task_type": "test_task", "base_success_rate": 0.8}
        avatar.attempt_task(task_context)
        
        summary = avatar.get_state_summary()
        
        required_fields = [
            "avatar_id", "trait_name", "current_state", "emotional_state",
            "cognitive_load", "stress_level", "burnout_risk_level",
            "overall_independence", "total_tasks_attempted", "total_tasks_completed",
            "total_coaching_sessions", "success_rate", "learning_progress",
            "last_activity"
        ]
        
        for field in required_fields:
            assert field in summary
        
        assert summary["avatar_id"] == "test_avatar_001"
        assert summary["trait_name"] == "test_trait"
        assert summary["total_tasks_attempted"] == 1
    
    def test_emotional_state_updates(self):
        """Test emotional state updates based on task results"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)
        
        # Test successful task with no struggles
        with patch('random.random', return_value=0.1):  # Force success
            with patch.object(avatar, 'simulate_struggle', return_value=[]):
                task_context = {"task_type": "test_task", "base_success_rate": 0.8}
                avatar.attempt_task(task_context)
                
                assert avatar.emotional_state == "confident"
        
        # Test failed task with many struggles
        with patch('random.random', return_value=0.9):  # Force failure
            with patch.object(avatar, 'simulate_struggle', return_value=["struggle1", "struggle2", "struggle3", "struggle4"]):
                avatar.attempt_task(task_context)
                
                assert avatar.emotional_state == "frustrated"
    
    def test_cognitive_load_updates(self):
        """Test cognitive load updates based on task demands"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)
        
        # High cognitive demand task
        task_context = {
            "task_type": "test_task",
            "base_success_rate": 0.8,
            "cognitive_demand": 0.9
        }
        
        avatar.attempt_task(task_context)
        
        # Cognitive load should be high due to trait impact
        assert avatar.cognitive_load > 0.8
    
    @pytest.mark.parametrize("success,struggles,expected_emotional", [
        (True, [], "confident"),
        (True, ["struggle"], "relieved"),
        (False, ["struggle"], "disappointed"),
        (False, ["struggle1", "struggle2", "struggle3", "struggle4"], "frustrated"),
    ])
    def test_emotional_state_scenarios(self, success, struggles, expected_emotional):
        """Test emotional state updates for different success/struggle scenarios"""
        config = {"trait_name": "test_trait"}
        avatar = TestAvatar("test_avatar_001", config)
        
        with patch('random.random', return_value=0.1 if success else 0.9):
            with patch.object(avatar, 'simulate_struggle', return_value=struggles):
                task_context = {"task_type": "test_task", "base_success_rate": 0.8}
                avatar.attempt_task(task_context)
                
                assert avatar.emotional_state == expected_emotional