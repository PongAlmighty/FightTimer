// Enable font debugging
window.DEBUG_FONTS = true;

const socket = io();

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
    
    // Load saved settings on page load
    const savedSettings = loadSettings();
    if (savedSettings) {
        console.log('Restoring saved settings:', savedSettings);
        if (savedSettings.googleFontUrl) {
            injectGoogleFont(savedSettings.googleFontUrl);
        }
        // Apply saved settings after a short delay to ensure DOM is ready
        setTimeout(() => {
            timer.updateSettings(savedSettings);
        }, 100);
    }
    
    // Request current settings from server
    socket.emit('request_current_settings');
    
    socket.on('timer_update', (data) => {
        if (data.settings && data.settings.googleFontUrl) {
            injectGoogleFont(data.settings.googleFontUrl);
        }
        switch (data.action) {
            case 'start':
                timer.start();
                break;
            case 'stop':
                timer.stop();
                break;
            case 'reset':
                timer.reset(data.minutes, data.seconds);
                break;
            case 'settings':
                // Save settings to localStorage for persistence
                saveSettings(data.settings);
                timer.updateSettings(data.settings);
                break;
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
            fonts[existingIndex] = {...fonts[existingIndex], ...font};
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
    fontFamily.addEventListener('change', function() {
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

    startBtn.addEventListener('click', () => {
        socket.emit('timer_control', { action: 'start' });
    });

    stopBtn.addEventListener('click', () => {
        socket.emit('timer_control', { action: 'stop' });
    });

    resetBtn.addEventListener('click', () => {
        socket.emit('timer_control', {
            action: 'reset',
            minutes: parseInt(minutesInput.value),
            seconds: parseInt(secondsInput.value)
        });
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
        
        // Send settings to server
        socket.emit('timer_control', { action: 'settings', settings });
        
        // Provide feedback that settings were applied
        const feedbackEl = document.getElementById('settings-feedback') || (() => {
            const el = document.createElement('div');
            el.id = 'settings-feedback';
            el.style.color = 'green';
            el.style.marginTop = '1em';
            document.querySelector('.customization').appendChild(el);
            return el;
        })();
        feedbackEl.textContent = 'Settings applied!';
        setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
    }
    
    // Add event listeners to all settings elements except fontFamily
    // (fontFamily has its own listener above that calls handleSettingsChange)
    [textColor, backgroundColor, fontVariant, endMessage, googleFontUrl, googleFontFamily].forEach(el => {
        el.addEventListener('change', handleSettingsChange);
    });
    
    // Special handling for fontSize to preserve font family
    fontSize.addEventListener('change', function() {
        // Store current font information before changing size
        const currentFontFamily = fontFamily.value;
        const selectedOption = fontFamily.options[fontFamily.selectedIndex];
        const isGoogleFont = selectedOption && selectedOption.dataset && selectedOption.dataset.isGoogleFont === 'true';
        
        // Apply settings with preserved font information
        handleSettingsChange();
        
        // Log that we're preserving the font choice
        console.log(`Font size changed, preserving font family: ${currentFontFamily} (Google Font: ${isGoogleFont})`);
    });
}
