/**
 * Mode Selection JavaScript
 * Handles user interaction for selecting between Single Timer and Multi-Timer modes
 */

class ModeSelection {
    constructor() {
        this.selectedMode = null;
        this.modeOptions = document.querySelectorAll('.mode-option');
        this.continueButton = document.getElementById('continueBtn');

        this.init();
    }

    init() {
        // Add event listeners to mode options
        this.modeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectMode(e.currentTarget);
            });
        });

        // Add event listener to continue button
        this.continueButton.addEventListener('click', () => {
            this.handleContinue();
        });

        // Check if user has a saved preference and auto-redirect
        this.checkSavedPreference();
    }

    selectMode(selectedOption) {
        // Remove selected class from all options
        this.modeOptions.forEach(option => {
            option.classList.remove('selected');
        });

        // Add selected class to clicked option
        selectedOption.classList.add('selected');

        // Store the selected mode
        this.selectedMode = selectedOption.dataset.mode;

        // Enable continue button
        this.continueButton.disabled = false;
    }

    handleContinue() {
        if (!this.selectedMode) {
            return;
        }

        // Save mode preference to localStorage
        this.saveModePreference(this.selectedMode);

        // Redirect to appropriate interface
        this.redirectToMode(this.selectedMode);
    }

    saveModePreference(mode) {
        try {
            localStorage.setItem('timerMode', mode);
            console.log(`Mode preference saved: ${mode}`);
        } catch (error) {
            console.error('Failed to save mode preference:', error);
            // Continue anyway - the app should still work without localStorage
        }
    }

    getModePreference() {
        try {
            return localStorage.getItem('timerMode');
        } catch (error) {
            console.error('Failed to read mode preference:', error);
            return null;
        }
    }

    // Check if we're on a specific timer page and should set mode automatically
    detectModeFromUrl() {
        const path = window.location.pathname;
        if (path === '/timer') {
            // User is on single timer page, set mode to single
            this.saveModePreference('single');
            return 'single';
        } else if (path.startsWith('/timer/')) {
            // User is on a specific timer page, set mode to multi
            this.saveModePreference('multi');
            return 'multi';
        } else if (path === '/control') {
            // Control panel - check existing preference or default to single for backward compatibility
            const existing = this.getModePreference();
            if (!existing) {
                this.saveModePreference('single');
                return 'single';
            }
            return existing;
        }
        return null;
    }

    checkSavedPreference() {
        // First check if we can detect mode from current URL
        const urlMode = this.detectModeFromUrl();
        if (urlMode) {
            console.log(`Detected mode from URL: ${urlMode}`);
            this.redirectToMode(urlMode);
            return;
        }

        // Then check saved preference
        const savedMode = this.getModePreference();
        if (savedMode) {
            // User has a saved preference, redirect immediately
            console.log(`Found saved mode preference: ${savedMode}`);
            this.redirectToMode(savedMode);
        } else {
            // No saved preference, show mode selection interface
            console.log('No saved mode preference found, showing mode selection');
        }
    }

    redirectToMode(mode) {
        if (mode === 'single') {
            // Redirect to single timer interface
            window.location.href = '/timer';
        } else if (mode === 'multi') {
            // Redirect to multi-timer control panel
            window.location.href = '/control';
        } else {
            console.error('Invalid mode:', mode);
        }
    }

    // Static method to get current mode from anywhere in the app
    static getCurrentMode() {
        try {
            return localStorage.getItem('timerMode') || 'single';
        } catch (error) {
            console.error('Failed to read mode preference:', error);
            return 'single'; // Default to single mode if localStorage fails
        }
    }

    // Static method to set mode from anywhere in the app
    static setMode(mode) {
        try {
            localStorage.setItem('timerMode', mode);
            return true;
        } catch (error) {
            console.error('Failed to save mode preference:', error);
            return false;
        }
    }

    // Static method to clear mode preference (for testing or reset)
    static clearModePreference() {
        try {
            localStorage.removeItem('timerMode');
            return true;
        } catch (error) {
            console.error('Failed to clear mode preference:', error);
            return false;
        }
    }
}

// Initialize mode selection when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ModeSelection();
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModeSelection;
}