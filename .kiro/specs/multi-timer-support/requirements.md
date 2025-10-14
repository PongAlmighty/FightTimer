# Requirements Document

## Introduction

This feature adds support for multiple independent timers to the existing timer application. Users will be able to choose between "Single Timer" mode (current behavior) and "Multi-Timer" mode (up to 5 separate timers). In Multi-Timer mode, each timer operates independently with its own settings, state, and API endpoints that require timer identification.

## Requirements

### Requirement 1

**User Story:** As a user, I want to choose between Single Timer and Multi-Timer modes, so that I can use either the current simple interface or manage multiple independent timers.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display a mode selection interface
2. WHEN the user selects "Single Timer" THEN the system SHALL behave exactly as the current version
3. WHEN the user selects "Multi-Timer" THEN the system SHALL enable multi-timer functionality with up to 5 timers
4. WHEN in Single Timer mode THEN the API SHALL NOT require timer identifiers (backward compatibility)
5. WHEN in Multi-Timer mode THEN the API SHALL require timer identifiers for all operations

### Requirement 2

**User Story:** As a user in Multi-Timer mode, I want to manage up to 5 independent timers, so that I can track multiple events simultaneously.

#### Acceptance Criteria

1. WHEN in Multi-Timer mode THEN the system SHALL support exactly 5 independent timers
2. WHEN a timer is created THEN the system SHALL assign it a unique identifier (1-5)
3. WHEN operating a timer THEN the system SHALL maintain independent state for each timer
4. WHEN displaying timers THEN the system SHALL show all active timers with clear identification
5. IF a timer is not in use THEN the system SHALL allow it to be hidden or minimized

### Requirement 3

**User Story:** As a user, I want each timer to have independent customization settings, so that I can visually distinguish between different timers.

#### Acceptance Criteria

1. WHEN customizing a timer THEN the system SHALL allow independent color settings per timer
2. WHEN customizing a timer THEN the system SHALL allow independent font settings per timer
3. WHEN customizing a timer THEN the system SHALL allow independent end message per timer
4. WHEN settings are applied THEN the system SHALL persist settings per timer identifier
5. WHEN switching between timers THEN the system SHALL maintain individual customization state

### Requirement 4

**User Story:** As an external system (like Bitfocus Companion), I want to control specific timers via API with timer identifiers, so that I can integrate with multi-timer functionality.

#### Acceptance Criteria

1. WHEN in Multi-Timer mode THEN the API SHALL require a timer_id parameter for all operations
2. WHEN timer_id is provided THEN the system SHALL route operations to the specified timer
3. WHEN timer_id is invalid THEN the system SHALL return an appropriate error response
4. WHEN in Single Timer mode THEN the API SHALL work without timer_id (backward compatibility)
5. IF timer_id is provided in Single Timer mode THEN the system SHALL ignore it and operate on the single timer

### Requirement 5

**User Story:** As a user, I want the control panel to adapt to the selected mode, so that I have appropriate controls for single or multiple timers.

#### Acceptance Criteria

1. WHEN in Single Timer mode THEN the control panel SHALL display current single-timer interface
2. WHEN in Multi-Timer mode THEN the control panel SHALL display a dropdown to select which timer to manage
3. WHEN a timer is selected from the dropdown THEN the control panel SHALL show that timer's current settings and controls
4. WHEN in Multi-Timer mode THEN each timer SHALL have an enable/disable checkbox to activate or deactivate it
5. WHEN switching between timers in the dropdown THEN the system SHALL preserve each timer's individual state and settings

### Requirement 6

**User Story:** As a user, I want each timer to have its own independent display output, so that I can use individual timer displays for different purposes or screens.

#### Acceptance Criteria

1. WHEN in Single Timer mode THEN the display SHALL show the single timer as it currently does
2. WHEN in Multi-Timer mode THEN each timer SHALL have its own separate display URL (e.g., /timer/1, /timer/2)
3. WHEN accessing a specific timer display THEN the system SHALL show only that timer's output
4. WHEN accessing a timer display THEN the system SHALL establish a dedicated WebSocket connection for that timer
5. WHEN a timer completes THEN the system SHALL show the end state only on that timer's individual display

### Requirement 7

**User Story:** As a user, I want seamless WebSocket communication for all timers, so that real-time updates work correctly in both modes.

#### Acceptance Criteria

1. WHEN in Single Timer mode THEN the system SHALL use the current WebSocket endpoint and message format
2. WHEN in Multi-Timer mode THEN each timer display SHALL have its own dedicated WebSocket namespace or endpoint
3. WHEN a timer display connects THEN the system SHALL establish a WebSocket connection specific to that timer
4. WHEN timer events occur THEN the system SHALL send updates to the relevant timer's WebSocket connection
5. WHEN the control panel connects THEN the system SHALL establish one WebSocket connection that can communicate with all timers for management purposes