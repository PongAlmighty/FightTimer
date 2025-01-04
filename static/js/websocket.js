const socket = io();

// Timer display page
if (document.getElementById('timerCanvas')) {
    socket.on('timer_update', (data) => {
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
    const fontSize = document.getElementById('fontSize');
    const endMessage = document.getElementById('endMessage');

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

    // Settings change handlers
    const updateSettings = () => {
        socket.emit('timer_control', {
            action: 'settings',
            settings: {
                textColor: textColor.value,
                backgroundColor: backgroundColor.value,
                fontFamily: fontFamily.value,
                fontSize: parseInt(fontSize.value),
                endMessage: endMessage.value
            }
        });
    };

    textColor.addEventListener('change', updateSettings);
    backgroundColor.addEventListener('change', updateSettings);
    fontFamily.addEventListener('change', updateSettings);
    fontSize.addEventListener('input', updateSettings);
    endMessage.addEventListener('input', updateSettings);
}