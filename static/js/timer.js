class Timer {
    constructor() {
        this.canvas = document.getElementById('timerCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.timeLeft = 300; // 5 minutes default
        this.isRunning = false;
        this.endMessage = 'TIME';
        this.settings = {
            textColor: '#ffffff',
            fontFamily: 'Arial',
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

    reset(minutes = 5, seconds = 0) {
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = this.settings.textColor;
        this.ctx.font = `${this.settings.fontSize}px ${this.settings.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const text = this.formatTime(this.timeLeft);
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    }
}

const timer = new Timer();
