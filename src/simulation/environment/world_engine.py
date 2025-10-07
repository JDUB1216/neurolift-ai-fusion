"""
World Engine

Core simulation engine that manages the virtual world, physics, events, and
overall simulation state. Handles the coordination between all simulation
components.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Any, Optional, Callable
import uuid
from datetime import datetime, timedelta


class SimulationState(Enum):
    """Current state of the simulation"""
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"


class EventType(Enum):
    """Types of events in the simulation"""
    TASK_START = "task_start"
    TASK_COMPLETE = "task_complete"
    TASK_FAIL = "task_fail"
    COACHING_INTERVENTION = "coaching_intervention"
    NPC_INTERACTION = "npc_interaction"
    ENVIRONMENT_CHANGE = "environment_change"
    TIME_EVENT = "time_event"
    CONSEQUENCE_APPLIED = "consequence_applied"


@dataclass
class Event:
    """An event in the simulation"""
    event_id: str
    event_type: EventType
    timestamp: datetime
    source: str  # What caused the event
    target: str  # What the event affects
    data: Dict[str, Any]
    processed: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/storage"""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
            "target": self.target,
            "data": self.data,
            "processed": self.processed,
        }


class WorldEngine:
    """
    Core simulation engine that manages the virtual world and coordinates
    all simulation components.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.simulation_id = str(uuid.uuid4())
        
        # Core state
        self.current_state = SimulationState.INITIALIZING
        self.simulation_time = datetime.now()
        self.real_time_start = datetime.now()
        
        # Event system
        self.event_queue: List[Event] = []
        self.event_history: List[Event] = []
        self.event_handlers: Dict[EventType, List[Callable]] = {}
        
        # World state
        self.world_objects: Dict[str, Any] = {}
        self.active_entities: Dict[str, Any] = {}
        self.environment_properties: Dict[str, Any] = {}
        
        # Physics and rules
        self.physics_rules: Dict[str, Any] = {}
        self.world_rules: Dict[str, Any] = {}
        
        # Performance tracking
        self.events_processed = 0
        self.simulation_steps = 0
        self.last_update = datetime.now()
        
    def initialize(self) -> bool:
        """
        Initialize the simulation world.
        
        Returns:
            True if initialization successful, False otherwise
        """
        try:
            self.current_state = SimulationState.INITIALIZING
            
            # Initialize world properties
            self._initialize_world_properties()
            
            # Set up physics rules
            self._setup_physics_rules()
            
            # Set up world rules
            self._setup_world_rules()
            
            # Initialize event system
            self._initialize_event_system()
            
            self.current_state = SimulationState.RUNNING
            return True
            
        except Exception as e:
            self.current_state = SimulationState.ERROR
            print(f"World initialization failed: {e}")
            return False
    
    def run_simulation_step(self) -> bool:
        """
        Run one step of the simulation.
        
        Returns:
            True if step successful, False otherwise
        """
        if self.current_state != SimulationState.RUNNING:
            return False
        
        try:
            # Process event queue
            self._process_event_queue()
            
            # Update world state
            self._update_world_state()
            
            # Apply physics rules
            self._apply_physics_rules()
            
            # Update simulation time
            self._update_simulation_time()
            
            self.simulation_steps += 1
            self.last_update = datetime.now()
            
            return True
            
        except Exception as e:
            self.current_state = SimulationState.ERROR
            print(f"Simulation step failed: {e}")
            return False
    
    def add_event(self, event_type: EventType, source: str, target: str, 
                  data: Dict[str, Any]) -> str:
        """
        Add an event to the simulation.
        
        Args:
            event_type: Type of event
            source: What caused the event
            target: What the event affects
            data: Event data
            
        Returns:
            Event ID
        """
        event = Event(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=self.simulation_time,
            source=source,
            target=target,
            data=data,
        )
        
        self.event_queue.append(event)
        return event.event_id
    
    def register_event_handler(self, event_type: EventType, handler: Callable) -> None:
        """
        Register an event handler.
        
        Args:
            event_type: Type of event to handle
            handler: Function to call when event occurs
        """
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        
        self.event_handlers[event_type].append(handler)
    
    def add_world_object(self, object_id: str, obj: Any) -> None:
        """
        Add an object to the world.
        
        Args:
            object_id: Unique identifier for the object
            obj: The object to add
        """
        self.world_objects[object_id] = obj
    
    def remove_world_object(self, object_id: str) -> None:
        """
        Remove an object from the world.
        
        Args:
            object_id: Identifier of object to remove
        """
        if object_id in self.world_objects:
            del self.world_objects[object_id]
    
    def get_world_object(self, object_id: str) -> Optional[Any]:
        """
        Get a world object by ID.
        
        Args:
            object_id: Identifier of object to get
            
        Returns:
            The object if found, None otherwise
        """
        return self.world_objects.get(object_id)
    
    def add_entity(self, entity_id: str, entity: Any) -> None:
        """
        Add an active entity to the simulation.
        
        Args:
            entity_id: Unique identifier for the entity
            entity: The entity to add
        """
        self.active_entities[entity_id] = entity
    
    def remove_entity(self, entity_id: str) -> None:
        """
        Remove an entity from the simulation.
        
        Args:
            entity_id: Identifier of entity to remove
        """
        if entity_id in self.active_entities:
            del self.active_entities[entity_id]
    
    def get_entity(self, entity_id: str) -> Optional[Any]:
        """
        Get an entity by ID.
        
        Args:
            entity_id: Identifier of entity to get
            
        Returns:
            The entity if found, None otherwise
        """
        return self.active_entities.get(entity_id)
    
    def get_simulation_state(self) -> Dict[str, Any]:
        """Get comprehensive simulation state"""
        return {
            "simulation_id": self.simulation_id,
            "current_state": self.current_state.value,
            "simulation_time": self.simulation_time.isoformat(),
            "real_time_elapsed": (datetime.now() - self.real_time_start).total_seconds(),
            "events_processed": self.events_processed,
            "simulation_steps": self.simulation_steps,
            "active_entities": len(self.active_entities),
            "world_objects": len(self.world_objects),
            "pending_events": len(self.event_queue),
            "last_update": self.last_update.isoformat(),
        }
    
    def pause_simulation(self) -> None:
        """Pause the simulation"""
        if self.current_state == SimulationState.RUNNING:
            self.current_state = SimulationState.PAUSED
    
    def resume_simulation(self) -> None:
        """Resume the simulation"""
        if self.current_state == SimulationState.PAUSED:
            self.current_state = SimulationState.RUNNING
    
    def stop_simulation(self) -> None:
        """Stop the simulation"""
        self.current_state = SimulationState.COMPLETED
    
    # Private helper methods
    
    def _initialize_world_properties(self) -> None:
        """Initialize world properties"""
        self.environment_properties = {
            "gravity": 9.8,
            "time_scale": 1.0,
            "realism_level": "high",
            "consequence_severity": "realistic",
            "social_dynamics": "enabled",
            "random_events": "enabled",
        }
    
    def _setup_physics_rules(self) -> None:
        """Set up physics rules for the simulation"""
        self.physics_rules = {
            "task_completion_requires_effort": True,
            "consequences_are_immediate": True,
            "time_passes_realistically": True,
            "social_interactions_have_impact": True,
            "random_challenges_occur": True,
        }
    
    def _setup_world_rules(self) -> None:
        """Set up world rules and constraints"""
        self.world_rules = {
            "avatars_must_struggle_authentically": True,
            "aides_can_intervene_anytime": True,
            "npcs_react_realistically": True,
            "consequences_are_meaningful": True,
            "learning_requires_repetition": True,
        }
    
    def _initialize_event_system(self) -> None:
        """Initialize the event system"""
        # Set up default event handlers
        for event_type in EventType:
            self.event_handlers[event_type] = []
    
    def _process_event_queue(self) -> None:
        """Process all events in the queue"""
        while self.event_queue:
            event = self.event_queue.pop(0)
            self._process_event(event)
            self.event_history.append(event)
            self.events_processed += 1
    
    def _process_event(self, event: Event) -> None:
        """Process a single event"""
        event.processed = True
        
        # Call registered handlers
        handlers = self.event_handlers.get(event.event_type, [])
        for handler in handlers:
            try:
                handler(event)
            except Exception as e:
                print(f"Event handler failed: {e}")
    
    def _update_world_state(self) -> None:
        """Update the world state"""
        # Update all active entities
        for entity_id, entity in self.active_entities.items():
            if hasattr(entity, 'update'):
                try:
                    entity.update(self.simulation_time)
                except Exception as e:
                    print(f"Entity update failed for {entity_id}: {e}")
    
    def _apply_physics_rules(self) -> None:
        """Apply physics rules to the world"""
        # This would apply various physics rules
        # For now, it's a placeholder for future implementation
        pass
    
    def _update_simulation_time(self) -> None:
        """Update simulation time"""
        time_scale = self.environment_properties.get("time_scale", 1.0)
        time_delta = timedelta(seconds=1 * time_scale)
        self.simulation_time += time_delta