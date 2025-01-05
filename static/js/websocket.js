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

// Populate font selector with system fonts
async function populateSystemFonts() {
    try {
        if ('queryLocalFonts' in window) {
            const availableFonts = await window.queryLocalFonts();
            fontFamily.innerHTML = ''; // Clear existing options
            
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
                fontVariant: document.getElementById('fontVariant').value,
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