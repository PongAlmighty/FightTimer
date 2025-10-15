"""
Timer management classes for single and multi-timer modes.

This module provides the core timer management infrastructure including:
- TimerManager: Handles single and multi-timer modes
- TimerState: Maintains individual timer state and operations
"""

import logging
from typing import Dict, Optional, Any
from dataclasses import dataclass, field, asdict

logger = logging.getLogger(__name__)


@dataclass
class TimerState:
    """Represents the state and operations for a single timer."""
    
    timer_id: int
    time_left: int = 180  # Default 3 minutes in seconds
    is_running: bool = False
    settings: Dict[str, Any] = field(default_factory=dict)
    enabled: bool = True
    
    def start(self) -> None:
        """Start the timer."""
        self.is_running = True
        logger.debug(f"Timer {self.timer_id} started")
    
    def stop(self) -> None:
        """Stop the timer."""
        self.is_running = False
        logger.debug(f"Timer {self.timer_id} stopped")
    
    def reset(self, minutes: int = 3, seconds: int = 0) -> None:
        """Reset the timer to specified time."""
        self.time_left = (minutes * 60) + seconds
        self.is_running = False
        logger.debug(f"Timer {self.timer_id} reset to {self.time_left} seconds")
    
    def update_settings(self, settings: Dict[str, Any]) -> None:
        """Update timer settings."""
        self.settings.update(settings)
        logger.debug(f"Timer {self.timer_id} settings updated: {settings}")
    
    def set_enabled(self, enabled: bool) -> None:
        """Set timer enabled state."""
        self.enabled = enabled
        logger.debug(f"Timer {self.timer_id} {'enabled' if enabled else 'disabled'}")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert timer state to dictionary."""
        return asdict(self)


class TimerManager:
    """Manages single and multi-timer modes with timer state persistence."""
    
    def __init__(self):
        self.timers: Dict[int, TimerState] = {}
        self.mode: str = 'single'  # 'single' or 'multi'
        self._initialize_default_timer()
        logger.debug("TimerManager initialized in single mode")
    
    def _initialize_default_timer(self) -> None:
        """Initialize the default timer for single mode."""
        self.timers[1] = TimerState(timer_id=1)
    
    def set_mode(self, mode: str) -> bool:
        """
        Switch between single and multi-timer modes.
        
        Args:
            mode: Either 'single' or 'multi'
            
        Returns:
            bool: True if mode was changed successfully
        """
        if mode not in ['single', 'multi']:
            logger.error(f"Invalid mode: {mode}")
            return False
        
        if self.mode == mode:
            logger.debug(f"Already in {mode} mode")
            return True
        
        old_mode = self.mode
        self.mode = mode
        
        if mode == 'multi':
            # Initialize all 5 timers for multi-timer mode
            for timer_id in range(1, 6):
                if timer_id not in self.timers:
                    self.timers[timer_id] = TimerState(timer_id=timer_id)
        elif mode == 'single':
            # Keep only timer 1 for single mode, but preserve its state
            timers_to_remove = [tid for tid in self.timers.keys() if tid != 1]
            for timer_id in timers_to_remove:
                del self.timers[timer_id]
        
        logger.info(f"Mode switched from {old_mode} to {mode}")
        return True
    
    def get_timer(self, timer_id: Optional[int] = None) -> Optional[TimerState]:
        """
        Get a timer based on current mode and timer_id.
        
        Args:
            timer_id: Timer ID (1-5). If None, returns default timer based on mode.
            
        Returns:
            TimerState or None if timer doesn't exist
        """
        if self.mode == 'single':
            # In single mode, always return timer 1, ignore timer_id
            return self.timers.get(1)
        
        # Multi-timer mode
        if timer_id is None:
            logger.warning("timer_id required in multi-timer mode")
            return None
        
        if timer_id not in range(1, 6):
            logger.error(f"Invalid timer_id: {timer_id}. Must be 1-5")
            return None
        
        # Create timer if it doesn't exist
        if timer_id not in self.timers:
            self.timers[timer_id] = TimerState(timer_id=timer_id)
            logger.debug(f"Created new timer {timer_id}")
        
        return self.timers[timer_id]
    
    def get_all_timers(self) -> Dict[int, TimerState]:
        """Get all active timers."""
        return self.timers.copy()
    
    def get_enabled_timers(self) -> Dict[int, TimerState]:
        """Get only enabled timers."""
        return {tid: timer for tid, timer in self.timers.items() if timer.enabled}
    
    def cleanup_timer(self, timer_id: int) -> bool:
        """
        Remove a timer from the manager.
        
        Args:
            timer_id: Timer ID to remove
            
        Returns:
            bool: True if timer was removed successfully
        """
        if timer_id == 1 and self.mode == 'single':
            logger.warning("Cannot remove timer 1 in single mode")
            return False
        
        if timer_id in self.timers:
            del self.timers[timer_id]
            logger.debug(f"Timer {timer_id} removed")
            return True
        
        return False
    
    def get_mode(self) -> str:
        """Get current mode."""
        return self.mode
    
    def get_timer_count(self) -> int:
        """Get number of active timers."""
        return len(self.timers)
    
    def is_valid_timer_id(self, timer_id: int) -> bool:
        """Check if timer_id is valid for current mode."""
        if self.mode == 'single':
            return timer_id == 1 or timer_id is None
        return timer_id in range(1, 6)