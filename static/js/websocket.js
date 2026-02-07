// Enable font debugging
window.DEBUG_FONTS = true;

// TimerWebSocketManager class for handling timer-specific WebSocket connections
class TimerWebSocketManager {
    constructor(timerId = null) {
        this.timerId = timerId;
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second

        this.connect();
    }

    connect() {
        try {
            // Determine the appropriate namespace based on timer ID
            if (this.timerId && this.timerId >= 1 && this.timerId <= 5) {
                // Multi-timer mode: connect to timer-specific namespace
                const namespace = `/timer${this.timerId}`;
                console.log(`Connecting to timer-specific namespace: ${namespace}`);
                this.socket = io(namespace);
            } else {
                // Single-timer mode: connect to default namespace
                console.log('Connecting to default namespace for single-timer mode');
                this.socket = io();
            }

            this.setupEventHandlers();
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.handleReconnect();
        }
    }

    setupEventHandlers() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log(`WebSocket connected${this.timerId ? ` for timer ${this.timerId}` : ''}`);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000; // Reset delay
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`WebSocket disconnected${this.timerId ? ` for timer ${this.timerId}` : ''}: ${reason}`);
            this.isConnected = false;

            // Only attempt reconnection for certain disconnect reasons
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, don't reconnect automatically
                console.log('Server initiated disconnect, not attempting reconnection');
            } else {
                // Client-side disconnect or network issue, attempt reconnection
                this.handleReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error(`WebSocket connection error${this.timerId ? ` for timer ${this.timerId}` : ''}:`, error);
            this.isConnected = false;
            this.handleReconnect();
        });

        this.socket.on('connection_response', (data) => {
            console.log(`Connection response${this.timerId ? ` for timer ${this.timerId}` : ''}:`, data);
        });
    }

    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`Max reconnection attempts reached${this.timerId ? ` for timer ${this.timerId}` : ''}`);
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}${this.timerId ? ` for timer ${this.timerId}` : ''} in ${this.reconnectDelay}ms`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);

        // Exponential backoff with jitter
        this.reconnectDelay = Math.min(this.reconnectDelay * 2 + Math.random() * 1000, 30000);
    }

    emit(event, data) {
        if (!this.socket || !this.isConnected) {
            console.warn(`Cannot emit ${event}: WebSocket not connected${this.timerId ? ` for timer ${this.timerId}` : ''}`);
            return false;
        }

        // Add timer_id to data if in multi-timer mode
        if (this.timerId && data && typeof data === 'object') {
            data.timer_id = this.timerId;
        }

        console.log(`Emitting ${event}${this.timerId ? ` for timer ${this.timerId}` : ''}:`, data);
        this.socket.emit(event, data);
        return true;
    }

    on(event, callback) {
        if (!this.socket) {
            console.warn(`Cannot register event ${event}: WebSocket not initialized${this.timerId ? ` for timer ${this.timerId}` : ''}`);
            return;
        }

        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (!this.socket) return;
        this.socket.off(event, callback);
    }

    disconnect() {
        if (this.socket) {
            console.log(`Disconnecting WebSocket${this.timerId ? ` for timer ${this.timerId}` : ''}`);
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            timerId: this.timerId,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    switchNamespace(timerId) {
        if (this.timerId === timerId) return;

        console.log(`Switching namespace from timer ${this.timerId} to timer ${timerId}`);

        // Disconnect current socket
        if (this.socket) {
            // Remove previous event handlers to prevent duplicates
            this.socket.off();
            this.socket.disconnect();
        }

        // Update timerId
        this.timerId = timerId;

        // Reset connection state
        this.isConnected = false;
        this.reconnectAttempts = 0;

        // Reconnect to new namespace
        this.connect();
    }
}

// Create WebSocket manager instance based on context
let socketManager;
if (typeof window !== 'undefined' && window.TIMER_ID) {
    // Timer display page with specific timer ID
    console.log(`Initializing WebSocket manager for timer ${window.TIMER_ID}`);
    socketManager = new TimerWebSocketManager(window.TIMER_ID);
} else {
    // Control panel or single-timer mode
    console.log('Initializing WebSocket manager for single-timer mode or control panel');
    socketManager = new TimerWebSocketManager();
}

// Maintain backward compatibility with existing code
const socket = socketManager.socket;

// Constants for localStorage keys
const TIMER_SETTINGS_KEY = 'fighttimer_settings';

// Helper functions for settings persistence
function saveSettings(settings) {
    try {
        localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save settings to localStorage:', e);
    }
}

function loadSettings() {
    try {
        const savedSettings = localStorage.getItem(TIMER_SETTINGS_KEY);
        return savedSettings ? JSON.parse(savedSettings) : null;
    } catch (e) {
        console.warn('Failed to load settings from localStorage:', e);
        return null;
    }
}

// Timer display page
if (document.getElementById('timerCanvas')) {
    function injectGoogleFont(url) {
        if (!url) return;
        let existing = document.getElementById('dynamic-google-font');
        if (existing) existing.remove();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.id = 'dynamic-google-font';
        document.head.appendChild(link);
    }

    // Load saved settings on page load with timer-specific key
    function getTimerSettingsKey() {
        if (window.TIMER_ID) {
            return `${TIMER_SETTINGS_KEY}_timer_${window.TIMER_ID}`;
        }
        return TIMER_SETTINGS_KEY;
    }

    function loadTimerSettings() {
        try {
            const settingsKey = getTimerSettingsKey();
            const savedSettings = localStorage.getItem(settingsKey);
            return savedSettings ? JSON.parse(savedSettings) : null;
        } catch (e) {
            console.warn('Failed to load timer settings from localStorage:', e);
            return null;
        }
    }

    function saveTimerSettings(settings) {
        try {
            const settingsKey = getTimerSettingsKey();
            localStorage.setItem(settingsKey, JSON.stringify(settings));
            console.log(`Saved settings for ${window.TIMER_ID ? `timer ${window.TIMER_ID}` : 'single timer'}:`, settings);
        } catch (e) {
            console.warn('Failed to save timer settings to localStorage:', e);
        }
    }

    const savedSettings = loadTimerSettings();
    if (savedSettings) {
        console.log(`Restoring saved settings for ${window.TIMER_ID ? `timer ${window.TIMER_ID}` : 'single timer'}:`, savedSettings);
        if (savedSettings.googleFontUrl) {
            injectGoogleFont(savedSettings.googleFontUrl);
        }
        // Apply saved settings after a short delay to ensure DOM is ready
        setTimeout(() => {
            timer.updateSettings(savedSettings);
        }, 100);
    }

    // Request current settings from server using the WebSocket manager
    const settingsRequest = {};
    if (window.TIMER_ID) {
        settingsRequest.timer_id = window.TIMER_ID;
    }
    console.log(`Requesting current settings${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}`);
    socketManager.emit('request_current_settings', settingsRequest);

    // Also request current timer status to restore timer state
    const statusRequest = {};
    if (window.TIMER_ID) {
        statusRequest.timer_id = window.TIMER_ID;
    }
    console.log(`Requesting timer status${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}`);
    socketManager.emit('request_timer_status', statusRequest);

    // Set up timer update handler using the WebSocket manager
    socketManager.on('timer_update', (data) => {
        if (data.is_heartbeat) {
            console.debug(`[Sync] Heartbeat received for timer ${data.timer_id || 'default'}:`, data);
        } else {
            console.log(`Timer update received${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}:`, data);
        }

        // Verify this update is for the correct timer in multi-timer mode
        if (window.TIMER_ID && data.timer_id && data.timer_id !== window.TIMER_ID) {
            // Special exception: allow Timer 1 updates if we are in single mode but receiving mirrored packets
            return;
        }

        if (data.settings && data.settings.googleFontUrl) {
            injectGoogleFont(data.settings.googleFontUrl);
        }

        switch (data.action) {
            case 'start':
                // For heartbeats, only start if not already running to maintain phase
                if (data.is_heartbeat && timer.isRunning) {
                    console.debug("[Sync] Timer already running, skipping start to maintain phase");
                } else {
                    timer.start();
                }
                break;
            case 'stop':
                timer.stop();
                break;
            case 'reset':
                if (data.is_heartbeat) {
                    // Check if drift is significant (> 1s) before snapping to avoid visual jitter
                    const diff = Math.abs(timer.timeLeft - ((data.minutes * 60) + data.seconds));
                    if (diff > 0) {
                        console.log(`[Sync] Correcting drift of ${diff}s`);
                        timer.reset(data.minutes, data.seconds);
                    }
                } else {
                    timer.reset(data.minutes, data.seconds);
                }
                break;
            case 'settings':
                // Save settings to localStorage for persistence (timer-specific)
                saveTimerSettings(data.settings);
                timer.updateSettings(data.settings);
                break;
        }
    });

    // Handle settings response from server
    socketManager.on('settings_response', (data) => {
        console.log(`Settings response received${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}:`, data);

        if (data.status === 'success' && data.settings) {
            // Verify this response is for the correct timer in multi-timer mode
            if (window.TIMER_ID && data.timer_id && data.timer_id !== window.TIMER_ID) {
                console.warn(`Received settings response for timer ${data.timer_id} but this is timer ${window.TIMER_ID}, ignoring`);
                return;
            }

            // Apply the settings
            if (data.settings.googleFontUrl) {
                injectGoogleFont(data.settings.googleFontUrl);
            }

            // Save settings to localStorage for persistence (timer-specific)
            saveTimerSettings(data.settings);

            // Apply settings to timer
            timer.updateSettings(data.settings);

            console.log(`Applied settings from server${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}`);
        } else if (data.status === 'error') {
            console.error(`Settings request failed${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}: ${data.message}`);
        }
    });

    // Handle timer status response from server
    socketManager.on('timer_status', (data) => {
        console.log(`Timer status received${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}:`, data);

        // Verify this status is for the correct timer in multi-timer mode
        if (window.TIMER_ID && data.timer_id && data.timer_id !== window.TIMER_ID) {
            console.warn(`Received timer status for timer ${data.timer_id} but this is timer ${window.TIMER_ID}, ignoring`);
            return;
        }

        // Restore timer state
        if (data.time_left !== undefined) {
            timer.timeLeft = data.time_left;
        }

        if (data.is_running !== undefined) {
            timer.isRunning = data.is_running;
            if (timer.isRunning) {
                // If timer is running, start the tick process
                timer.tick();
            }
        }

        // Redraw the timer with the restored state
        timer.draw();

        console.log(`Restored timer state${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}: ${data.time_left}s, running: ${data.is_running}`);
    });

    // Handle error responses
    socketManager.on('error', (data) => {
        console.error(`WebSocket error${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}:`, data);

        // If timer not found, this might be a new timer that needs initialization
        if (data.message && data.message.includes('not found') && window.TIMER_ID) {
            console.log(`Timer ${window.TIMER_ID} not found on server, it may need to be initialized`);
            // The timer will be created automatically when the control panel interacts with it
        }
    });

    // Handle connection events
    socketManager.on('connection_response', (data) => {
        console.log(`Connection established${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}:`, data);

        // Re-request settings and status after connection is established
        if (data.status === 'connected') {
            setTimeout(() => {
                const settingsRequest = {};
                const statusRequest = {};
                if (window.TIMER_ID) {
                    settingsRequest.timer_id = window.TIMER_ID;
                    statusRequest.timer_id = window.TIMER_ID;
                }

                console.log(`Re-requesting settings and status after connection${window.TIMER_ID ? ` for timer ${window.TIMER_ID}` : ''}`);
                socketManager.emit('request_current_settings', settingsRequest);
                socketManager.emit('request_timer_status', statusRequest);
            }, 100); // Small delay to ensure connection is fully established
        }
    });
}

// Control panel page
if (document.querySelector('.control-panel')) {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resetBtn = document.getElementById('resetBtn');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const textColor = document.getElementById('textColor');
    const backgroundColor = document.getElementById('backgroundColor');
    const fontFamily = document.getElementById('fontFamily');
    const googleFontUrl = document.getElementById('googleFontUrl');
    const googleFontFamily = document.getElementById('googleFontFamily');
    const fontSize = document.getElementById('fontSize');
    const fontVariant = document.getElementById('fontVariant');
    const endMessage = document.getElementById('endMessage');

    // Google Font handling
    function injectGoogleFont(url, id) {
        if (!url) return;
        // Use a unique id for each font
        id = id || ('dynamic-google-font-' + btoa(url).replace(/[^a-z0-9]/gi, ''));
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.id = id;
        document.head.appendChild(link);
    }

    // Manage Google Fonts in localStorage
    const GOOGLE_FONTS_KEY = 'fighttimer_google_fonts';
    function getStoredGoogleFonts() {
        try {
            return JSON.parse(localStorage.getItem(GOOGLE_FONTS_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }
    function storeGoogleFont(font) {
        const fonts = getStoredGoogleFonts();
        // Check if font already exists
        const existingIndex = fonts.findIndex(f => f.family === font.family);

        if (existingIndex >= 0) {
            // Update existing font with new URLs
            fonts[existingIndex] = { ...fonts[existingIndex], ...font };
        } else {
            // Add new font
            fonts.push(font);
        }

        localStorage.setItem(GOOGLE_FONTS_KEY, JSON.stringify(fonts));
        console.log('Stored font:', font);
    }
    function restoreGoogleFonts() {
        const fonts = getStoredGoogleFonts();
        fonts.forEach(font => {
            // Use localUrl if available, otherwise fall back to original url
            const fontUrl = font.localUrl || font.url;
            injectGoogleFont(fontUrl, font.id);
            addFontFamilyOption(font.family, true);
            console.log(`Restored font: ${font.family} using URL: ${fontUrl}`);
        });
    }
    function addFontFamilyOption(family, isGoogle) {
        // Check if option already exists
        for (let i = 0; i < fontFamily.options.length; i++) {
            if (fontFamily.options[i].value === family) {
                return; // Already exists
            }
        }
        const option = document.createElement('option');
        option.value = family;
        option.textContent = family + (isGoogle ? ' (Google)' : '');
        if (isGoogle) option.dataset.isGoogleFont = 'true';
        fontFamily.appendChild(option);
    }

    // Function to extract font family and variants from Google Font URL
    function extractFontInfoFromUrl(url) {
        try {
            // Initialize result object
            const result = {
                family: null,
                variants: []
            };

            // Extract family parameter from URL
            const familyMatch = url.match(/family=([^&]+)/i);
            if (!familyMatch || !familyMatch[1]) return result;

            // Parse the family parameter
            const familyParam = familyMatch[1];

            // Check if there are multiple families (we'll just use the first one)
            const families = familyParam.split('|');
            const firstFamily = families[0];

            // Split family name from variants
            const [familyWithPlus, variantsPart] = firstFamily.split(':');

            // Replace + with spaces and decode family name
            result.family = decodeURIComponent(familyWithPlus.replace(/\+/g, ' '));

            // Extract variants if present
            if (variantsPart) {
                // Handle different variant formats
                if (variantsPart.includes('@')) {
                    // Format like wght@400;700 or ital,wght@0,400;1,400
                    const [axes, values] = variantsPart.split('@');
                    const axesArray = axes.split(',');

                    // Check for variable font range format (e.g., wght@400..900)
                    if (values.includes('..')) {
                        console.log('Variable font range detected:', values);

                        // Handle each axis that might have a range
                        axesArray.forEach((axis, axisIndex) => {
                            if (axis === 'wght') {
                                // For weight ranges, extract start and end
                                const ranges = values.split(';');

                                ranges.forEach(range => {
                                    if (range.includes('..')) {
                                        // It's a variable range like 400..900
                                        const [start, end] = range.split('..').map(Number);

                                        if (!isNaN(start) && !isNaN(end)) {
                                            // Generate standard weights within the range
                                            const standardWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

                                            standardWeights.forEach(weight => {
                                                if (weight >= start && weight <= end) {
                                                    // Create a variant for each weight in range
                                                    result.variants.push({
                                                        weight: weight.toString(),
                                                        style: 'normal',
                                                        stretch: 'normal'
                                                    });

                                                    // If we have italic axis, add italic variants too
                                                    if (axesArray.includes('ital')) {
                                                        result.variants.push({
                                                            weight: weight.toString(),
                                                            style: 'italic',
                                                            stretch: 'normal'
                                                        });
                                                    }
                                                }
                                            });

                                            console.log(`Generated ${result.variants.length} variants from range ${start}..${end}`);
                                        }
                                    }
                                });
                            }
                        });
                    } else {
                        // Regular non-variable format
                        // Parse each variant value
                        values.split(';').forEach(value => {
                            // For combined axes like ital,wght@0,400;1,400
                            if (value.includes(',')) {
                                const axisValues = value.split(',');
                                const variant = {
                                    weight: 'normal',
                                    style: 'normal',
                                    stretch: 'normal'
                                };

                                // Map axis values to variant properties
                                axesArray.forEach((axis, index) => {
                                    if (axis === 'wght') {
                                        variant.weight = axisValues[index] || '400';
                                    } else if (axis === 'ital') {
                                        variant.style = axisValues[index] === '1' ? 'italic' : 'normal';
                                    }
                                });

                                result.variants.push(variant);
                            } else {
                                // For single axis like wght@400;700
                                const variant = {
                                    weight: 'normal',
                                    style: 'normal',
                                    stretch: 'normal'
                                };

                                if (axes === 'wght') {
                                    variant.weight = value;
                                } else if (axes === 'ital') {
                                    variant.style = value === '1' ? 'italic' : 'normal';
                                }

                                result.variants.push(variant);
                            }
                        });
                    }
                } else {
                    // Older format like 400,700,italic,700italic
                    variantsPart.split(',').forEach(variant => {
                        const variantObj = {
                            weight: 'normal',
                            style: 'normal',
                            stretch: 'normal'
                        };

                        if (variant.includes('italic')) {
                            variantObj.style = 'italic';
                            // Extract weight if present (e.g., 700italic)
                            const weightMatch = variant.match(/(\d+)italic/);
                            if (weightMatch && weightMatch[1]) {
                                variantObj.weight = weightMatch[1];
                            }
                        } else if (!isNaN(parseInt(variant))) {
                            // It's a weight like 400, 700
                            variantObj.weight = variant;
                        }

                        result.variants.push(variantObj);
                    });
                }
            }

            // If no variants were specified, add default (400 normal)
            if (result.variants.length === 0) {
                result.variants.push({
                    weight: '400',
                    style: 'normal',
                    stretch: 'normal'
                });
            }

            console.log('Extracted font info:', result);
            return result;
        } catch (e) {
            console.error('Error extracting font info:', e);
            return { family: null, variants: [] };
        }
    }

    // Backward compatibility function
    function extractFontFamilyFromUrl(url) {
        return extractFontInfoFromUrl(url).family;
    }

    // Elements for font detection display
    const detectedFontContainer = document.getElementById('detected-font-container');
    const detectedFontName = document.getElementById('detected-font-name');

    // Auto-detect font family from URL
    googleFontUrl.addEventListener('input', () => {
        const url = googleFontUrl.value.trim();
        if (!url) {
            if (detectedFontContainer) {
                detectedFontContainer.style.display = 'none';
            }
            return;
        }

        const family = extractFontFamilyFromUrl(url);
        if (family) {
            detectedFontContainer.style.display = 'block';
            detectedFontName.textContent = family;
            // Store the font family in the hidden input
            googleFontFamily.value = family;
        }
    });

    // Function to request local font URL from server
    async function getLocalFontUrl(googleFontUrl) {
        try {
            // First check if we already have this font stored locally
            const storedFonts = getStoredGoogleFonts();
            const existingFont = storedFonts.find(f => f.url === googleFontUrl);

            if (existingFont && existingFont.localUrl) {
                console.log('Using cached local URL for font:', existingFont.family);
                return existingFont.localUrl;
            }

            // If not found or no local URL, request from server
            console.log('Requesting local URL for Google Font:', googleFontUrl);
            const response = await fetch('/fonts/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: googleFontUrl }),
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Received local URL:', data);

            if (data.success && data.localUrl) {
                return data.localUrl;
            } else {
                throw new Error(data.error || 'Unknown error downloading font');
            }
        } catch (error) {
            console.error('Error getting local font URL:', error);
            // Fall back to original URL if there's an error
            return googleFontUrl;
        }
    }

    // Add Font button logic
    const addFontBtn = document.getElementById('addGoogleFontBtn');
    const googleFontFeedback = document.getElementById('google-font-feedback');
    addFontBtn.addEventListener('click', async () => {
        const url = googleFontUrl.value.trim();
        let family = googleFontFamily.value.trim();
        let variants = [];

        // Reset feedback styles
        googleFontFeedback.style.color = 'red';

        // Basic validation for Google Fonts URL
        if (!url) {
            googleFontFeedback.textContent = 'Please enter a Google Font URL.';
            return;
        }

        if (!/^https:\/\/fonts\.googleapis\.com\//.test(url)) {
            googleFontFeedback.textContent = 'URL must be a valid Google Fonts CSS URL.';
            return;
        }

        // Try to extract font info from URL if not already set
        if (!family) {
            const fontInfo = extractFontInfoFromUrl(url);
            family = fontInfo.family;
            variants = fontInfo.variants;

            if (!family) {
                googleFontFeedback.textContent = 'Could not detect font family from URL. Please try a different URL format.';
                return;
            }
            // Update the detected font display
            detectedFontContainer.style.display = 'block';
            detectedFontName.textContent = family;
            googleFontFamily.value = family;

            // Log the detected variants
            console.log(`Detected ${variants.length} variants for font: ${family}`);
            variants.forEach(v => console.log(`- ${v.style} ${v.weight} ${v.stretch}`));
        }

        // Show loading message
        googleFontFeedback.style.color = 'blue';
        googleFontFeedback.textContent = `Downloading and storing font '${family}'...`;

        try {
            // Get the local URL for this font
            const localUrl = await getLocalFontUrl(url);

            // Inject the font (using local URL if available)
            injectGoogleFont(localUrl);

            // Store the font info with both original and local URLs and variants
            const fontInfo = {
                url: url,  // Original URL for reference
                localUrl: localUrl, // Local URL for actual use
                family: family,
                variants: variants, // Store detected variants
                id: 'dynamic-google-font-' + btoa(url).replace(/[^a-z0-9]/gi, '')
            };
            storeGoogleFont(fontInfo);

            // Add to font family dropdown if not already there
            addFontFamilyOption(family, true);

            // Show success message
            googleFontFeedback.style.color = 'green';
            googleFontFeedback.textContent = `Font '${family}' added successfully!`;

            // Select the newly added font in the dropdown
            for (let i = 0; i < fontFamily.options.length; i++) {
                if (fontFamily.options[i].value === family) {
                    fontFamily.selectedIndex = i;
                    break;
                }
            }

            // Apply settings with the new font
            handleSettingsChange();
        } catch (error) {
            console.error('Error adding font:', error);
            googleFontFeedback.style.color = 'red';
            googleFontFeedback.textContent = `Error adding font: ${error.message}`;
        }
    });

    // Restore Google Fonts and add to dropdown on load
    restoreGoogleFonts();

    // Function to populate variant dropdown with available variants
    function populateVariantDropdown(variants) {
        // Get the variant dropdown
        const variantSelect = document.getElementById('fontVariant');
        if (!variantSelect) return;

        // Clear existing options
        variantSelect.innerHTML = '';

        // Define weight map for display names
        const weightMap = {
            '100': 'Thin',
            '200': 'Extra Light',
            '300': 'Light',
            '400': 'Regular',
            '500': 'Medium',
            '600': 'Semi Bold',
            '700': 'Bold',
            '800': 'Extra Bold',
            '900': 'Black'
        };

        // Sort variants by weight and style
        const sortedVariants = [...variants].sort((a, b) => {
            // Sort by weight first
            const weightA = parseInt(a.weight) || 400;
            const weightB = parseInt(b.weight) || 400;
            if (weightA !== weightB) return weightA - weightB;

            // Then by style (normal first, then italic)
            return a.style === 'normal' ? -1 : 1;
        });

        // Add each variant as an option
        sortedVariants.forEach(variant => {
            const option = document.createElement('option');

            // Create display name
            let variantDesc = weightMap[variant.weight] || variant.weight;
            if (variant.style !== 'normal') {
                variantDesc += ` ${variant.style}`;
            }

            // Set option values
            option.value = JSON.stringify(variant);
            option.textContent = variantDesc;

            // Add to dropdown
            variantSelect.appendChild(option);
        });

        console.log(`Populated variant dropdown with ${variants.length} variants`);
    }

    // Add event listener for font family dropdown changes
    fontFamily.addEventListener('change', function () {
        const selectedOption = fontFamily.options[fontFamily.selectedIndex];

        // Check if the selected font is a Google Font
        if (selectedOption && selectedOption.dataset && selectedOption.dataset.isGoogleFont === 'true') {
            const fontName = selectedOption.value;
            const storedFonts = getStoredGoogleFonts();
            const fontData = storedFonts.find(f => f.family === fontName);

            if (fontData) {
                // Update the Google Font URL and family input fields for reference
                googleFontUrl.value = fontData.url || ''; // Original URL for reference
                googleFontFamily.value = fontName;

                // Use local URL if available, otherwise fall back to original URL
                const fontUrl = fontData.localUrl || fontData.url;

                // Inject the font to ensure it's loaded
                injectGoogleFont(fontUrl);

                // Show the detected font info
                if (detectedFontContainer) {
                    detectedFontContainer.style.display = 'block';
                    detectedFontName.textContent = fontName;
                }

                // Populate variant dropdown if variants are available
                if (fontData.variants && fontData.variants.length > 0) {
                    populateVariantDropdown(fontData.variants);
                } else {
                    // If no variants stored, extract them from the URL
                    const fontInfo = extractFontInfoFromUrl(fontData.url);
                    if (fontInfo.variants && fontInfo.variants.length > 0) {
                        // Update stored font data with variants
                        fontData.variants = fontInfo.variants;
                        storeGoogleFont(fontData);

                        // Populate dropdown
                        populateVariantDropdown(fontInfo.variants);
                    }
                }

                console.log(`Activated Google Font: ${fontName} with URL: ${fontUrl} (local: ${!!fontData.localUrl})`);
            }
        } else {
            // Clear Google Font fields if a system font is selected
            googleFontUrl.value = '';
            googleFontFamily.value = '';

            // Hide the detected font container
            if (detectedFontContainer) {
                detectedFontContainer.style.display = 'none';
            }
        }

        // Force a redraw by applying settings immediately
        console.log('Font changed to:', fontFamily.value);
        handleSettingsChange();
    });

    // System font population
    async function populateSystemFonts() {
        try {
            if (window.queryLocalFonts) {
                console.log('Using Local Font Access API to populate system fonts');
                const availableFonts = await window.queryLocalFonts();

                // Create a map of fonts and their variants
                const fontMap = new Map();
                availableFonts.forEach(font => {
                    if (!fontMap.has(font.family)) {
                        fontMap.set(font.family, new Set());
                    }
                    fontMap.get(font.family).add(JSON.stringify({
                        weight: font.weight,
                        style: font.style,
                        stretch: font.stretch
                    }));
                });

                // Populate font families
                [...fontMap.keys()].sort().forEach(font => {
                    const option = document.createElement('option');
                    option.value = font;
                    option.textContent = font;
                    fontFamily.appendChild(option);
                });

                // Function to update variants
                const updateVariants = () => {
                    const variants = fontMap.get(fontFamily.value);
                    const variantSelect = document.getElementById('fontVariant');
                    variantSelect.innerHTML = '';

                    [...variants].map(v => JSON.parse(v))
                        .sort((a, b) => parseInt(a.weight) - parseInt(b.weight))
                        .forEach(variant => {
                            const option = document.createElement('option');
                            const weightMap = {
                                '100': 'Thin',
                                '200': 'Extra Light',
                                '300': 'Light',
                                '400': 'Regular',
                                '500': 'Medium',
                                '600': 'Semi Bold',
                                '700': 'Bold',
                                '800': 'Extra Bold',
                                '900': 'Black'
                            };
                            let variantDesc = weightMap[variant.weight] || variant.weight;
                            if (variant.style !== 'normal') {
                                variantDesc += ` ${variant.style}`;
                            }
                            option.value = JSON.stringify(variant);
                            option.textContent = variantDesc;
                            variantSelect.appendChild(option);
                        });
                };

                // Initial variant population
                updateVariants();
                fontFamily.addEventListener('change', updateVariants);
            } else {
                console.log('Local Font Access API not supported');
            }
        } catch (error) {
            console.error('Error accessing system fonts:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', populateSystemFonts);
    } else {
        populateSystemFonts();
    }

    // Enhanced timer control handlers for multi-timer support
    startBtn.addEventListener('click', () => {
        const controlData = { action: 'start' };

        // Add timer_id if in multi-timer mode
        if (multiTimerControls && multiTimerControls.style.display !== 'none') {
            controlData.timer_id = currentSelectedTimer;
        }

        socketManager.emit('timer_control', controlData);
    });

    stopBtn.addEventListener('click', () => {
        const controlData = { action: 'stop' };

        // Add timer_id if in multi-timer mode
        if (multiTimerControls && multiTimerControls.style.display !== 'none') {
            controlData.timer_id = currentSelectedTimer;
        }

        socketManager.emit('timer_control', controlData);
    });

    resetBtn.addEventListener('click', () => {
        const controlData = {
            action: 'reset',
            minutes: parseInt(minutesInput.value),
            seconds: parseInt(secondsInput.value)
        };

        // Add timer_id if in multi-timer mode
        if (multiTimerControls && multiTimerControls.style.display !== 'none') {
            controlData.timer_id = currentSelectedTimer;
        }

        socketManager.emit('timer_control', controlData);
    });

    // Handle settings changes
    // Add color conflict warning logic
    const colorWarningId = 'color-warning-msg';
    function showColorWarning() {
        let warning = document.getElementById(colorWarningId);
        if (!warning) {
            warning = document.createElement('div');
            warning.id = colorWarningId;
            warning.style.color = 'red';
            warning.style.marginTop = '0.5em';
            warning.textContent = 'Warning: Text color and background color are the same. Timer text will be invisible!';
            // Insert after background color picker
            const bgPicker = backgroundColor.parentElement;
            bgPicker.parentElement.insertBefore(warning, bgPicker.nextSibling);
        }
    }
    function hideColorWarning() {
        const warning = document.getElementById(colorWarningId);
        if (warning) warning.remove();
    }

    // Create a function to handle settings changes to avoid code duplication
    function handleSettingsChange() {
        // Check for color conflict (text and background same color)
        if (textColor.value.toLowerCase() === backgroundColor.value.toLowerCase()) {
            showColorWarning();
            return; // Don't send settings if conflict
        } else {
            hideColorWarning();
        }

        // Store current settings for reference
        const currentSettings = loadSettings() || {};

        // Determine which font family to use
        let fontFamilyValue = fontFamily.value;
        let fontUrl = '';
        let localFontUrl = '';

        // Check if the selected font is a Google Font
        const selectedOption = fontFamily.options[fontFamily.selectedIndex];
        if (selectedOption && selectedOption.dataset && selectedOption.dataset.isGoogleFont === 'true') {
            // Get the font data from storage
            const storedFonts = getStoredGoogleFonts();
            const fontData = storedFonts.find(f => f.family === fontFamilyValue);

            if (fontData) {
                // Use original URL for reference
                fontUrl = fontData.url || '';
                // Use local URL if available for actual loading
                localFontUrl = fontData.localUrl || fontUrl;

                // Update the input fields for reference
                googleFontUrl.value = fontUrl;
                googleFontFamily.value = fontFamilyValue;

                // Show the detected font info
                if (detectedFontContainer) {
                    detectedFontContainer.style.display = 'block';
                    detectedFontName.textContent = fontFamilyValue;
                }

                console.log(`Using font: ${fontFamilyValue} with local URL: ${localFontUrl}`);
            }
        } else if (googleFontUrl.value && googleFontFamily.value) {
            // If Google Font is manually entered, use that instead
            fontFamilyValue = googleFontFamily.value;
            fontUrl = googleFontUrl.value;
            // Try to find a local URL for this font
            const storedFonts = getStoredGoogleFonts();
            const fontData = storedFonts.find(f => f.family === fontFamilyValue);
            if (fontData && fontData.localUrl) {
                localFontUrl = fontData.localUrl;
            } else {
                localFontUrl = fontUrl;
            }
        }

        console.log('Applying settings with font:', fontFamilyValue, 'URL:', fontUrl);

        // Prepare settings object
        const settings = {
            textColor: textColor.value,
            backgroundColor: backgroundColor.value,
            fontFamily: fontFamilyValue,
            fontVariant: fontVariant.value,
            fontSize: parseInt(fontSize.value, 10),
            endMessage: endMessage.value,
            googleFontUrl: fontUrl || currentSettings.googleFontUrl || '',
            googleFontFamily: fontFamilyValue === fontFamily.value ? (currentSettings.googleFontFamily || '') : fontFamilyValue
        };

        // Debug log to track font settings
        console.log('Settings being applied:', {
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            googleFontUrl: settings.googleFontUrl,
            googleFontFamily: settings.googleFontFamily
        });

        // Save settings locally for persistence
        saveSettings(settings);

        // Inject Google Font if needed (using local URL if available)
        if (localFontUrl) {
            injectGoogleFont(localFontUrl);
        } else if (fontUrl) {
            injectGoogleFont(fontUrl);
        }

        // Send settings to server using WebSocket manager
        socketManager.emit('timer_control', { action: 'settings', settings });

        // Provide feedback that settings were applied
        let feedbackEl = document.getElementById('settings-feedback');
        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'settings-feedback';
            feedbackEl.style.color = 'green';
            feedbackEl.style.marginTop = '1em';
            feedbackEl.style.transition = 'opacity 0.3s ease';
            document.querySelector('.customization').appendChild(feedbackEl);
        }
        feedbackEl.style.opacity = '1';
        feedbackEl.textContent = 'Settings applied!';
        setTimeout(() => { 
            feedbackEl.style.opacity = '0';
            setTimeout(() => { feedbackEl.textContent = ''; }, 300);
        }, 2000);
    }

    // Add event listeners to all settings elements except fontFamily
    // (fontFamily has its own listener above that calls handleSettingsChange)
    [textColor, backgroundColor, fontVariant, endMessage, googleFontUrl, googleFontFamily].forEach(el => {
        el.addEventListener('change', handleSettingsChange);
    });

    // Special handling for fontSize to preserve font family
    fontSize.addEventListener('change', function () {
        // Store current font information before changing size
        const currentFontFamily = fontFamily.value;
        const selectedOption = fontFamily.options[fontFamily.selectedIndex];
        const isGoogleFont = selectedOption && selectedOption.dataset && selectedOption.dataset.isGoogleFont === 'true';

        // Apply settings with preserved font information
        handleSettingsChange();

        // Log that we're preserving the font choice
        console.log(`Font size changed, preserving font family: ${currentFontFamily} (Google Font: ${isGoogleFont})`);
    });

    // Multi-timer control functionality
    const modeDisplay = document.getElementById('current-mode');
    const multiTimerControls = document.getElementById('multi-timer-controls');
    const timerSelector = document.getElementById('timer-selector');
    const toggleModeBtn = document.getElementById('toggle-mode-btn');

    // Timer enable/disable checkboxes
    const timerCheckboxes = {};
    for (let i = 1; i <= 5; i++) {
        timerCheckboxes[i] = document.getElementById(`timer-${i}-enabled`);
    }

    // Current selected timer for settings management
    let currentSelectedTimer = 1;

    // Timer-specific settings storage
    const MULTI_TIMER_SETTINGS_KEY = 'fighttimer_multi_timer_settings';

    function saveTimerSettings(timerId, settings) {
        try {
            const allTimerSettings = JSON.parse(localStorage.getItem(MULTI_TIMER_SETTINGS_KEY) || '{}');
            allTimerSettings[timerId] = settings;
            localStorage.setItem(MULTI_TIMER_SETTINGS_KEY, JSON.stringify(allTimerSettings));
            console.log(`Saved settings for timer ${timerId}:`, settings);
        } catch (e) {
            console.warn('Failed to save timer settings to localStorage:', e);
        }
    }

    function loadTimerSettings(timerId) {
        try {
            const allTimerSettings = JSON.parse(localStorage.getItem(MULTI_TIMER_SETTINGS_KEY) || '{}');
            return allTimerSettings[timerId] || null;
        } catch (e) {
            console.warn('Failed to load timer settings from localStorage:', e);
            return null;
        }
    }

    function saveTimerEnabledState(timerId, enabled) {
        try {
            const enabledStates = JSON.parse(localStorage.getItem('fighttimer_timer_enabled_states') || '{}');
            enabledStates[timerId] = enabled;
            localStorage.setItem('fighttimer_timer_enabled_states', JSON.stringify(enabledStates));
        } catch (e) {
            console.warn('Failed to save timer enabled state:', e);
        }
    }

    function loadTimerEnabledState(timerId) {
        try {
            const enabledStates = JSON.parse(localStorage.getItem('fighttimer_timer_enabled_states') || '{}');
            return enabledStates[timerId] !== undefined ? enabledStates[timerId] : true; // Default to enabled
        } catch (e) {
            console.warn('Failed to load timer enabled state:', e);
            return true;
        }
    }

    function updateModeDisplay(mode) {
        if (modeDisplay) {
            modeDisplay.textContent = mode === 'multi' ? 'Multi-Timer' : 'Single Timer';
        }

        if (multiTimerControls) {
            multiTimerControls.style.display = mode === 'multi' ? 'block' : 'none';
        }

        // Toggle endpoint info sections
        const singleTimerInfo = document.getElementById('single-timer-info');
        if (singleTimerInfo) {
            singleTimerInfo.style.display = mode === 'single' ? 'block' : 'none';
        }

        if (toggleModeBtn) {
            toggleModeBtn.textContent = mode === 'multi' ? 'Switch to Single Timer' : 'Switch to Multi-Timer';
        }
    }

    // Mode switching functionality
    async function switchMode(newMode) {
        try {
            console.log(`Switching to ${newMode} mode...`);

            const response = await fetch('/api/mode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mode: newMode })
            });

            const data = await response.json();

            if (data.status === 'success') {
                console.log(`Successfully switched to ${newMode} mode`);
                updateModeDisplay(newMode);

                // Save mode preference to localStorage
                try {
                    localStorage.setItem('timerMode', newMode);
                } catch (e) {
                    console.warn('Failed to save mode preference to localStorage:', e);
                }

                // If switching to multi-timer mode, load settings and namespace for timer 1
                if (newMode === 'multi') {
                    socketManager.switchNamespace(1);
                    loadSettingsForTimer(1);
                }

                // Show success feedback
                showModeChangeSuccess(newMode);
            } else {
                console.error('Failed to switch mode:', data.error);
                showModeChangeError(data.error);
            }
        } catch (error) {
            console.error('Error switching mode:', error);
            showModeChangeError('Network error occurred while switching mode');
        }
    }

    function showModeChangeSuccess(mode) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 1rem;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        feedback.textContent = `Switched to ${mode === 'multi' ? 'Multi-Timer' : 'Single Timer'} mode`;
        document.body.appendChild(feedback);

        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 3000);
    }

    function showModeChangeError(error) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #f44336;
            color: white;
            padding: 1rem;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        feedback.textContent = `Error: ${error}`;
        document.body.appendChild(feedback);

        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 5000);
    }

    // Mode toggle button event listener
    if (toggleModeBtn) {
        toggleModeBtn.addEventListener('click', async () => {
            const currentMode = modeDisplay.textContent.includes('Multi-Timer') ? 'multi' : 'single';
            const newMode = currentMode === 'multi' ? 'single' : 'multi';

            // Disable button during switch
            toggleModeBtn.disabled = true;
            toggleModeBtn.textContent = 'Switching...';

            await switchMode(newMode);

            // Re-enable button
            toggleModeBtn.disabled = false;
        });
    }

    function loadSettingsForTimer(timerId) {
        console.log(`Loading settings for timer ${timerId}`);

        // Save current settings before switching
        if (currentSelectedTimer !== timerId) {
            saveCurrentSettings();
        }

        currentSelectedTimer = timerId;

        // Load timer-specific settings
        const timerSettings = loadTimerSettings(timerId);
        if (timerSettings) {
            console.log(`Applying saved settings for timer ${timerId}:`, timerSettings);

            // Apply settings to form elements
            if (timerSettings.textColor) textColor.value = timerSettings.textColor;
            if (timerSettings.backgroundColor) backgroundColor.value = timerSettings.backgroundColor;
            if (timerSettings.fontFamily) fontFamily.value = timerSettings.fontFamily;
            if (timerSettings.fontSize) fontSize.value = timerSettings.fontSize;
            if (timerSettings.endMessage) endMessage.value = timerSettings.endMessage;
            if (timerSettings.googleFontUrl) googleFontUrl.value = timerSettings.googleFontUrl;
            if (timerSettings.googleFontFamily) googleFontFamily.value = timerSettings.googleFontFamily;

            // Handle font variant
            if (timerSettings.fontVariant) {
                fontVariant.value = timerSettings.fontVariant;
            }

            // Update detected font display if Google Font is set
            if (timerSettings.googleFontFamily) {
                const detectedFontContainer = document.getElementById('detected-font-container');
                const detectedFontName = document.getElementById('detected-font-name');
                if (detectedFontContainer && detectedFontName) {
                    detectedFontContainer.style.display = 'block';
                    detectedFontName.textContent = timerSettings.googleFontFamily;
                }
            }
        } else {
            console.log(`No saved settings found for timer ${timerId}, using defaults`);
            // Reset to default values
            textColor.value = '#000000';
            backgroundColor.value = '#00ff00';
            fontFamily.value = 'Arial';
            fontSize.value = '100';
            endMessage.value = 'TIME';
            googleFontUrl.value = '';
            googleFontFamily.value = '';
            fontVariant.value = 'normal';
        }
    }

    function saveCurrentSettings() {
        if (currentSelectedTimer) {
            const settings = {
                textColor: textColor.value,
                backgroundColor: backgroundColor.value,
                fontFamily: fontFamily.value,
                fontSize: fontSize.value,
                endMessage: endMessage.value,
                googleFontUrl: googleFontUrl.value,
                googleFontFamily: googleFontFamily.value,
                fontVariant: fontVariant.value
            };
            saveTimerSettings(currentSelectedTimer, settings);
        }
    }

    // Timer selector change handler
    if (timerSelector) {
        timerSelector.addEventListener('change', function () {
            const selectedTimerId = parseInt(this.value);
            console.log(`Timer selector changed to: ${selectedTimerId}`);

            // Switch WebSocket namespace
            socketManager.switchNamespace(selectedTimerId);

            // Load settings for the new timer (updates UI inputs)
            loadSettingsForTimer(selectedTimerId);

            // Wait a moment for connection then request current status
            setTimeout(() => {
                socketManager.emit('request_timer_status', { timer_id: selectedTimerId });
                socketManager.emit('request_current_settings', { timer_id: selectedTimerId });
            }, 500);
        });
    }

    // Remove individual checkbox handlers logic as it's no longer used

    // Check current mode on page load
    fetch('/api/mode')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateModeDisplay(data.mode);

                // If in multi-timer mode, load settings and namespace for timer 1 by default
                if (data.mode === 'multi') {
                    socketManager.switchNamespace(1);
                    loadSettingsForTimer(1);
                }
            }
        })
        .catch(error => {
            console.error('Error checking mode:', error);
            // Default to single timer mode on error
            updateModeDisplay('single');
        });

    // Override the existing handleSettingsChange function to work with multi-timer
    const originalHandleSettingsChange = handleSettingsChange;
    handleSettingsChange = function () {
        // Check for color conflict (text and background same color)
        if (textColor.value.toLowerCase() === backgroundColor.value.toLowerCase()) {
            showColorWarning();
        } else {
            hideColorWarning();
        }

        const settings = {
            textColor: textColor.value,
            backgroundColor: backgroundColor.value,
            fontFamily: fontFamily.value,
            fontSize: fontSize.value,
            endMessage: endMessage.value,
            googleFontUrl: googleFontUrl.value,
            googleFontFamily: googleFontFamily.value,
            fontVariant: fontVariant.value
        };

        // Save settings for current timer in multi-timer mode
        if (multiTimerControls && multiTimerControls.style.display !== 'none') {
            saveTimerSettings(currentSelectedTimer, settings);

            // Send settings with timer_id for multi-timer mode
            socketManager.emit('timer_control', {
                action: 'settings',
                timer_id: currentSelectedTimer,
                settings: settings
            });
        } else {
            // Single timer mode - use original behavior
            socketManager.emit('timer_control', {
                action: 'settings',
                settings: settings
            });
        }

        // Provide feedback that settings were applied
        let feedbackEl = document.getElementById('settings-feedback');
        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'settings-feedback';
            feedbackEl.style.color = 'green';
            feedbackEl.style.marginTop = '1em';
            feedbackEl.style.transition = 'opacity 0.3s ease';
            document.querySelector('.customization').appendChild(feedbackEl);
        }
        feedbackEl.style.opacity = '1';
        feedbackEl.textContent = 'Settings applied!';
        setTimeout(() => { 
            feedbackEl.style.opacity = '0';
            setTimeout(() => { feedbackEl.textContent = ''; }, 300);
        }, 2000);
    };

    // WebSocket event handlers for multi-timer support
    socketManager.on('timer_state_changed', (data) => {
        console.log('Timer state changed:', data);

        // Update UI based on timer state change
        if (data.timer_id && data.state) {
            // If this is the currently selected timer, update the time inputs
            if (data.timer_id === currentSelectedTimer && data.state.time_left !== undefined) {
                const totalSeconds = data.state.time_left;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;

                minutesInput.value = minutes;
                secondsInput.value = seconds;
            }
        }
    });

    socketManager.on('multi_timer_status', (data) => {
        console.log('Multi-timer status update:', data);

        // Update all timer checkboxes based on server state
        if (data.timers) {
            Object.keys(data.timers).forEach(timerId => {
                const timerData = data.timers[timerId];
                const checkbox = timerCheckboxes[parseInt(timerId)];

                if (checkbox && timerData.enabled !== undefined) {
                    checkbox.checked = timerData.enabled;
                }
            });
        }
    });

    socketManager.on('timer_enabled_response', (data) => {
        console.log('Timer enabled response:', data);
        if (data.status === 'success') {
            console.log(`Timer ${data.timer_id} ${data.enabled ? 'enabled' : 'disabled'} successfully`);
        }
    });

    // Handle settings response from server to sync UI
    socketManager.on('settings_response', (data) => {
        console.log('Control panel received settings response:', data);
        if (data.status === 'success' && data.settings) {
            const s = data.settings;
            if (s.textColor) textColor.value = s.textColor;
            if (s.backgroundColor) backgroundColor.value = s.backgroundColor;
            if (s.fontFamily) {
                fontFamily.value = s.fontFamily;
                // Trigger change to update variants if needed
                const event = new Event('change');
                fontFamily.dispatchEvent(event);
            }
            if (s.fontSize) fontSize.value = s.fontSize;
            if (s.endMessage) endMessage.value = s.endMessage;
            if (s.googleFontUrl) googleFontUrl.value = s.googleFontUrl;
            if (s.googleFontFamily) googleFontFamily.value = s.googleFontFamily;
            if (s.fontVariant) fontVariant.value = s.fontVariant;

            // Save to local storage for persistence
            saveTimerSettings(data.timer_id, s);
        }
    });

    // Handle timer status response to sync time inputs
    socketManager.on('timer_status', (data) => {
        console.log('Control panel received timer status:', data);
        if (data.time_left !== undefined) {
            const minutes = Math.floor(data.time_left / 60);
            const seconds = data.time_left % 60;
            minutesInput.value = minutes;
            secondsInput.value = seconds;
        }
    });

    // Request initial timer status when in multi-timer mode
    socketManager.on('connect', () => {
        console.log('Control panel connected to WebSocket');

        // Check if we're in multi-timer mode and request status
        fetch('/api/mode')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.mode === 'multi') {
                    // Request current timer status
                    socketManager.emit('request_multi_timer_status', {});
                }
            })
            .catch(error => {
                console.error('Error checking mode on connect:', error);
            });
    });
}
