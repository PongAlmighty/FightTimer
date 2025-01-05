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
        if (!this.isRunning) {
            this.isRunning = true;
            this.tick();
        }
    }

    stop() {
        this.isRunning = false;
    }

    reset(minutes = 3, seconds = 0) {
        this.timeLeft = (minutes * 60) + seconds;
        this.draw();
    }

    tick() {
        if (!this.isRunning) return;

        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.draw();
            setTimeout(() => this.tick(), 1000);
        } else {
            this.draw();
        }
    }

    formatTime(seconds) {
        if (seconds <= 0) return this.endMessage;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateSettings(settings) {
        Object.assign(this.settings, settings);
        this.draw();
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
        const variant = JSON.parse(this.settings.fontVariant || '{"weight":"normal","style":"normal","stretch":"normal"}');
        this.ctx.font = `${variant.style} ${variant.weight} ${variant.stretch} ${this.settings.fontSize}px "${this.settings.fontFamily}"`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const text = this.formatTime(this.timeLeft);
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    }
}

const timer = new Timer();