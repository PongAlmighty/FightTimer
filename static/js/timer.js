class Timer {
    constructor() {
        this.canvas = document.getElementById('timerCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.timeLeft = 180; // 3 minutes default
        this.isRunning = false;
        this.endMessage = 'TIME';
        this.settings = {
            textColor: '#000000',
            backgroundColor: '#00ff00',
            fontFamily: 'DSEG14 Modern',
            fontSize: 100
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.draw();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        console.log("Timer start called, current isRunning:", this.isRunning);
        this.isRunning = true;
        this._startTime = Date.now();
        this._startTimeLeft = this.timeLeft;
        this.tick();
    }

    stop() {
        this.isRunning = false;
        if (this.tickTimeout) {
            clearTimeout(this.tickTimeout);
            this.tickTimeout = null;
        }
    }

    reset(minutes = 3, seconds = 0) {
        console.log(`Timer reset called: ${minutes}:${seconds}`);
        this.timeLeft = (minutes * 60) + seconds;
        this._startTime = null;
        this._startTimeLeft = this.timeLeft;
        this.draw();
    }

    tick() {
        if (!this.isRunning) return;

        if (this.tickTimeout) {
            clearTimeout(this.tickTimeout);
        }

        // Calculate time left from wall clock to avoid drift from throttled setTimeout
        const elapsed = this._startTime ? Math.floor((Date.now() - this._startTime) / 1000) : 0;
        this.timeLeft = Math.max(0, this._startTimeLeft - elapsed);

        this.draw();

        if (this.timeLeft > 0) {
            this.tickTimeout = setTimeout(() => this.tick(), 200);
        } else {
            this.isRunning = false;
        }
    }

    formatTime(seconds) {
        if (seconds <= 0) return this.endMessage;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Cache for loaded fonts to avoid repeated loading
    static loadedFonts = new Set();

    updateSettings(settings) {
        // Store previous font and size for comparison
        const prevFont = this.settings.fontFamily;
        const prevGoogleFont = this.settings.googleFontFamily;
        const prevFontSize = this.settings.fontSize;

        // Update settings
        Object.assign(this.settings, settings);

        if (settings.endMessage !== undefined) {
            this.endMessage = settings.endMessage;
        }

        // Prefer googleFontFamily if set
        if (settings.googleFontFamily) {
            this.settings.fontFamily = settings.googleFontFamily;
        }

        // Check if font has changed
        const fontChanged = prevFont !== this.settings.fontFamily ||
            prevGoogleFont !== this.settings.googleFontFamily;

        // Check if only the font size has changed
        const onlyFontSizeChanged = !fontChanged && prevFontSize !== this.settings.fontSize;

        if (fontChanged) {
            // Font family changed - need full font loading process
            console.log('Font changed to:', this.settings.fontFamily);
            this.drawWithFontLoad();
        } else if (onlyFontSizeChanged) {
            // Only size changed - need to preload the font at the new size but preserve the font family
            console.log(`Font size changed to: ${this.settings.fontSize}px (preserving font: ${this.settings.fontFamily})`);
            // Preload the font at the new size
            this.preloadFont(this.settings.fontFamily, this.settings.fontSize);
            // Force multiple redraws to ensure proper rendering
            this.forceMultipleRedraws();
        } else {
            // Just redraw with current settings
            this.draw();
        }
    }

    // Force multiple redraws to ensure font renders correctly
    forceMultipleRedraws() {
        // Reset redraw counter
        this.#redrawCount = 0;

        // Clear any existing redraw interval
        if (this.#redrawInterval) {
            clearInterval(this.#redrawInterval);
            this.#redrawInterval = null;
        }

        // Force multiple redraws to ensure font renders correctly
        this.#redrawInterval = setInterval(() => {
            this.#redrawCount++;
            console.log(`Forced redraw ${this.#redrawCount}/${this.#maxRedraws} for size change`);

            // Reset canvas and redraw
            this.resetCanvasContext();
            this.draw();

            // Stop after max redraws
            if (this.#redrawCount >= this.#maxRedraws) {
                clearInterval(this.#redrawInterval);
                this.#redrawInterval = null;
                console.log(`Completed ${this.#maxRedraws} forced redraws for size change`);
            }
        }, 25); // Redraw more frequently (25ms instead of 50ms)
    }

    // Reset canvas context to clear any cached rendering information
    resetCanvasContext() {
        // Get the current canvas dimensions
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear the canvas by resizing it (forces a complete reset)
        this.canvas.width = width;
        this.canvas.height = height;

        // Re-initialize context properties that might have been reset
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        console.log('Canvas context reset');
    }

    draw() {
        // Fill background
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw running indicator
        if (this.isRunning) {
            this.ctx.fillStyle = '#4CAF50'; // Green dot when running
            this.ctx.beginPath();
            this.ctx.arc(30, 30, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = this.settings.textColor;

        // Safely parse font variant with error handling
        let variant = { weight: 'normal', style: 'normal', stretch: 'normal' };
        try {
            variant = JSON.parse(this.settings.fontVariant || '{"weight":"normal","style":"normal","stretch":"normal"}');
        } catch (e) {
            console.warn('Error parsing font variant:', e);
            // Continue with default variant
        }

        // Get font family, with fallbacks
        const fontFamily = this.settings.fontFamily || (this.settings.googleFontFamily || 'Arial');

        // Set font with fallback mechanism
        const fontString = `${variant.style} ${variant.weight} ${variant.stretch} ${this.settings.fontSize}px "${fontFamily}", Arial, sans-serif`;
        this.ctx.font = fontString;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const text = this.formatTime(this.timeLeft);
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        // Debug font information
        if (window.DEBUG_FONTS) {
            console.log(`Drawing with font: ${fontString}`);
        }
    }

    // Counter for forced redraws
    #redrawCount = 0;
    #maxRedraws = 20; // Increased from 10 to 20
    #redrawInterval = null;
    #fontLoadPromises = new Map(); // Track font loading promises

    // Draw after ensuring font is loaded
    drawWithFontLoad() {
        const fontFamily = this.settings.fontFamily || (this.settings.googleFontFamily || 'Arial');
        const fontSize = this.settings.fontSize || 100;

        console.log(`Starting font load process for: ${fontFamily}`);

        // Reset canvas context to clear any cached rendering information
        this.resetCanvasContext();

        // Always draw immediately to ensure time is displayed
        this.draw();

        // Clear any existing redraw interval
        if (this.#redrawInterval) {
            clearInterval(this.#redrawInterval);
            this.#redrawInterval = null;
        }

        // Reset redraw counter
        this.#redrawCount = 0;

        // Preload the font more aggressively
        this.preloadFont(fontFamily, fontSize);

        // Force multiple redraws to ensure font renders correctly
        // This simulates what happens when the timer is running
        this.#redrawInterval = setInterval(() => {
            this.#redrawCount++;
            console.log(`Forced redraw ${this.#redrawCount}/${this.#maxRedraws} for font: ${fontFamily}`);

            // Reset canvas and redraw
            this.resetCanvasContext();
            this.draw();

            // Stop after max redraws
            if (this.#redrawCount >= this.#maxRedraws) {
                clearInterval(this.#redrawInterval);
                this.#redrawInterval = null;
                console.log(`Completed ${this.#maxRedraws} forced redraws for font: ${fontFamily}`);
            }
        }, 25); // Redraw more frequently (25ms instead of 50ms)
    }

    // Preload font more aggressively
    preloadFont(fontFamily, fontSize) {
        // Use normal/normal/normal as default variant
        let variant = { weight: 'normal', style: 'normal', stretch: 'normal' };
        try {
            variant = JSON.parse(this.settings.fontVariant || '{"weight":"normal","style":"normal","stretch":"normal"}');
        } catch (e) { }

        const fontKey = fontFamily.toLowerCase();
        const fontStr = `${variant.style} ${variant.weight} ${variant.stretch} ${fontSize}px "${fontFamily}"`;
        console.log(`Preloading font: ${fontStr}`);

        // Check if we already have a loading promise for this font
        if (this.#fontLoadPromises.has(fontKey)) {
            console.log(`Already loading font: ${fontFamily}`);
            return this.#fontLoadPromises.get(fontKey);
        }

        // Create a new loading promise
        if (document.fonts && document.fonts.load) {
            // Create multiple font loading promises with different sizes
            // This helps ensure the font is properly loaded and cached
            const promises = [];

            // Load the font at different sizes to ensure it's properly cached
            [fontSize, fontSize / 2, fontSize * 2].forEach(size => {
                const sizeStr = `${variant.style} ${variant.weight} ${variant.stretch} ${size}px "${fontFamily}"`;
                promises.push(document.fonts.load(sizeStr));
            });

            // Add a dummy text element with the font to force loading
            const dummyText = document.createElement('div');
            dummyText.style.fontFamily = `"${fontFamily}", Arial, sans-serif`;
            dummyText.style.fontSize = `${fontSize}px`;
            dummyText.style.fontWeight = variant.weight;
            dummyText.style.fontStyle = variant.style;
            dummyText.style.position = 'absolute';
            dummyText.style.visibility = 'hidden';
            dummyText.textContent = '0123456789:'; // Include all characters used in the timer
            document.body.appendChild(dummyText);

            // Create a combined promise
            const fontLoadPromise = Promise.all(promises)
                .then(() => {
                    console.log(`Font loaded successfully: ${fontFamily}`);
                    // Mark this font as loaded
                    Timer.loadedFonts.add(fontKey);
                    // Remove the dummy text element
                    document.body.removeChild(dummyText);
                    // Remove from the promises map
                    this.#fontLoadPromises.delete(fontKey);
                    // Force a redraw
                    this.resetCanvasContext();
                    this.draw();
                    return true;
                })
                .catch(err => {
                    console.warn(`Font loading error for ${fontFamily}:`, err);
                    // Remove the dummy text element
                    if (document.body.contains(dummyText)) {
                        document.body.removeChild(dummyText);
                    }
                    // Remove from the promises map
                    this.#fontLoadPromises.delete(fontKey);
                    return false;
                });

            // Add a timeout to the promise
            const timeoutPromise = new Promise(resolve => {
                setTimeout(() => {
                    console.log(`Font load timeout for: ${fontFamily}`);
                    // Remove the dummy text element
                    if (document.body.contains(dummyText)) {
                        document.body.removeChild(dummyText);
                    }
                    // Remove from the promises map
                    this.#fontLoadPromises.delete(fontKey);
                    resolve(false);
                }, 1000); // 1 second timeout
            });

            // Store the promise in the map
            const racePromise = Promise.race([fontLoadPromise, timeoutPromise]);
            this.#fontLoadPromises.set(fontKey, racePromise);
            return racePromise;
        }

        return Promise.resolve(false);
    }
}

const timer = new Timer();