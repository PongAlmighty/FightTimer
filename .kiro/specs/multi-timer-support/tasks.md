# Implementation Plan

- [x] 1. Create backend timer management infrastructure
  - Implement TimerManager class to handle single and multi-timer modes
  - Create TimerState class to maintain individual timer state
  - Add mode switching logic and timer state persistence
  - _Requirements: 1.2, 1.3, 2.2, 2.3_

- [x] 1.1 Implement TimerManager class
  - Create TimerManager class with timer dictionary and mode management
  - Add methods for getting/creating timers based on mode
  - Implement timer state initialization and cleanup
  - _Requirements: 1.2, 1.3, 2.2_

- [x] 1.2 Implement TimerState class
  - Create TimerState class with timer_id, time_left, is_running, settings, enabled properties
  - Add methods for timer control (start, stop, reset)
  - Implement settings management per timer
  - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.3_

- [ ]* 1.3 Write unit tests for timer management classes
  - Create unit tests for TimerManager functionality
  - Write unit tests for TimerState operations
  - Test mode switching and timer isolation
  - _Requirements: 1.2, 1.3, 2.2, 2.3_

- [x] 2. Extend Flask routes for multi-timer API support
  - Add new API endpoints for multi-timer operations
  - Implement backward compatibility for single-timer mode
  - Add timer status and mode management endpoints
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.1 Create multi-timer API endpoints
  - Add `/api/timer/<int:timer_id>` route for timer-specific operations
  - Implement `/api/mode` endpoint for mode switching
  - Add `/api/timers/status` endpoint for multi-timer status
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 2.2 Update existing timer API for backward compatibility
  - Modify `/api/timer` to work with TimerManager
  - Ensure single-timer mode operates without timer_id
  - Add logic to ignore timer_id in single-timer mode
  - _Requirements: 4.4, 4.5_

- [x] 2.3 Add timer display routes for multi-timer mode
  - Create `/timer/<int:timer_id>` routes for individual timer displays
  - Implement timer validation and error handling
  - Add timer-specific template rendering
  - _Requirements: 6.2, 6.3_

- [ ]* 2.4 Write API endpoint tests
  - Create integration tests for multi-timer API endpoints
  - Test backward compatibility with existing API
  - Verify error handling for invalid timer IDs
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Implement WebSocket namespace management
  - Set up timer-specific WebSocket namespaces
  - Create WebSocket handlers for each timer namespace
  - Implement control panel WebSocket for multi-timer management
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3.1 Create WebSocket namespaces for multi-timer mode
  - Set up `/timer/<timer_id>` namespaces for each timer (1-5)
  - Implement namespace-specific event handlers
  - Add timer-specific connection and disconnection handling
  - _Requirements: 7.2, 7.3_

- [x] 3.2 Update WebSocket handlers for timer operations
  - Modify timer control handlers to work with TimerManager
  - Add timer_id routing for multi-timer operations
  - Ensure single-timer mode maintains current WebSocket behavior
  - _Requirements: 7.1, 7.4_

- [x] 3.3 Implement control panel WebSocket management
  - Create control panel WebSocket connection for multi-timer management
  - Add handlers for timer selection and status updates
  - Implement broadcasting to specific timer namespaces
  - _Requirements: 7.5_

- [ ]* 3.4 Write WebSocket integration tests
  - Test WebSocket namespace isolation
  - Verify timer-specific message routing
  - Test control panel multi-timer communication
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4. Create mode selection interface
  - Build initial mode selection page
  - Implement localStorage persistence for mode preference
  - Add routing logic for mode-based navigation
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4.1 Create mode selection HTML template
  - Design mode selection interface with Single Timer and Multi-Timer options
  - Add clear descriptions for each mode
  - Implement responsive design for different screen sizes
  - _Requirements: 1.1_

- [x] 4.2 Implement mode selection JavaScript logic
  - Add event handlers for mode selection buttons
  - Implement localStorage persistence for mode preference
  - Add navigation logic to redirect to appropriate interface
  - _Requirements: 1.2, 1.3_

- [x] 4.3 Update main route to handle mode selection
  - Modify index route to check for mode preference
  - Add logic to redirect to mode selection if no preference set
  - Ensure backward compatibility for existing users
  - _Requirements: 1.1, 1.4_

- [x] 5. Enhance control panel for multi-timer support
  - Add timer selection dropdown for multi-timer mode
  - Implement enable/disable checkboxes for each timer
  - Update settings management for multiple timers
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5.1 Update control panel HTML template
  - Add timer selection dropdown for multi-timer mode
  - Create enable/disable checkboxes for each timer (1-5)
  - Add mode indicator to show current operational mode
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 5.2 Implement timer selection and management JavaScript
  - Add dropdown change handlers for timer selection
  - Implement enable/disable checkbox functionality
  - Add logic to load and save settings per timer
  - _Requirements: 5.2, 5.3, 5.5_

- [x] 5.3 Update control panel WebSocket integration
  - Modify WebSocket handlers to work with selected timer
  - Add timer-specific settings synchronization
  - Implement multi-timer status updates
  - _Requirements: 5.3, 5.5_

- [ ]* 5.4 Write control panel integration tests
  - Test timer selection dropdown functionality
  - Verify enable/disable checkbox behavior
  - Test settings persistence across timer switches
  - _Requirements: 5.2, 5.3, 5.5_

- [x] 6. Create individual timer display components
  - Build timer-specific display templates
  - Implement timer-specific WebSocket connections
  - Add timer identification in display interfaces
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 6.1 Create timer-specific display templates
  - Create individual timer display HTML templates
  - Add timer identification elements to displays
  - Ensure consistent styling with existing timer display
  - _Requirements: 6.2, 6.5_

- [x] 6.2 Implement timer-specific JavaScript clients
  - Create TimerWebSocketManager class for connection management
  - Implement timer-specific WebSocket connection logic
  - Add timer ID parameter handling in client code
  - _Requirements: 6.4_

- [ ] 6.3 Update timer display JavaScript for multi-timer support
  - Modify existing Timer class to work with timer IDs
  - Add timer-specific state management
  - Implement timer identification in WebSocket messages
  - _Requirements: 6.4, 6.5_

- [ ]* 6.4 Write timer display integration tests
  - Test individual timer display functionality
  - Verify timer-specific WebSocket connections
  - Test timer isolation and independence
  - _Requirements: 6.2, 6.4, 6.5_

- [x] 7. Integrate and test complete multi-timer system
  - Connect all components and test end-to-end functionality
  - Verify backward compatibility with single-timer mode
  - Test multi-timer independence and isolation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7.1 Integrate backend and frontend components
  - Connect TimerManager with Flask routes and WebSocket handlers
  - Integrate mode selection with control panel and displays
  - Ensure proper error handling across all components
  - _Requirements: 1.4, 1.5_

- [x] 7.2 Test backward compatibility
  - Verify single-timer mode works exactly as before
  - Test existing API endpoints maintain compatibility
  - Ensure WebSocket behavior unchanged in single-timer mode
  - _Requirements: 1.4, 4.4, 4.5_

- [x] 7.3 Test multi-timer independence
  - Verify each timer operates independently
  - Test timer-specific settings and state isolation
  - Confirm WebSocket namespace separation
  - _Requirements: 2.3, 2.4, 2.5_

- [ ]* 7.4 Write comprehensive end-to-end tests
  - Create full workflow tests for both modes
  - Test mode switching and timer management
  - Verify multi-timer scenarios with all 5 timers active
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 8. Complete timer display WebSocket integration for multi-timer mode
  - Update timer display JavaScript to connect to timer-specific WebSocket namespaces
  - Implement timer ID detection and namespace routing in timer displays
  - Ensure timer displays work independently with their own WebSocket connections
  - _Requirements: 6.4, 7.2, 7.3_

- [x] 8.1 Update timer display WebSocket connection logic
  - Modify websocket.js to detect timer ID from window.TIMER_ID
  - Implement namespace-specific WebSocket connections for timer displays
  - Add timer ID to all WebSocket messages from timer displays
  - _Requirements: 6.4, 7.2_

- [x] 8.2 Fix timer display settings synchronization
  - Ensure timer displays request settings with correct timer ID
  - Update settings persistence to be timer-specific in multi-timer mode
  - Implement proper timer state restoration for individual timer displays
  - _Requirements: 6.4, 6.5, 7.3_