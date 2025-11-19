class PomodoroTimer {
    constructor() {
        // Default settings
        this.settings = {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            longBreakInterval: 4,
            soundEnabled: true,
            autoStartBreaks: false,
            autoStartPomodoros: false
        };

        // Timer state
        this.mode = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.timeLeft = this.settings.workDuration * 60;
        this.totalTime = this.settings.workDuration * 60;
        this.isRunning = false;
        this.sessionsCompleted = 0;
        this.intervalId = null;

        // DOM elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.modeDisplay = document.getElementById('modeDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.sessionCounter = document.getElementById('sessionCounter');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeModal = document.getElementById('closeModal');
        this.saveSettings = document.getElementById('saveSettings');
        this.progressCircle = document.getElementById('progressCircle');

        // Load settings from localStorage
        this.loadSettings();
        
        // Initialize
        this.updateDisplay();
        this.updateProgress();
        this.attachEventListeners();
        this.createAudioContext();
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeModal.addEventListener('click', () => this.closeSettings());
        this.saveSettings.addEventListener('click', () => this.saveSettingsHandler());
        
        // Close modal on background click
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isModalOpen()) {
                e.preventDefault();
                this.isRunning ? this.pause() : this.start();
            }
        });
    }

    start() {
        this.isRunning = true;
        this.startBtn.classList.add('hidden');
        this.pauseBtn.classList.remove('hidden');
        
        this.intervalId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();
            
            if (this.timeLeft === 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        this.pauseBtn.classList.add('hidden');
        this.startBtn.classList.remove('hidden');
        clearInterval(this.intervalId);
    }

    reset() {
        this.pause();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateProgress();
    }

    timerComplete() {
        this.pause();
        
        // Play sound
        if (this.settings.soundEnabled) {
            this.playSound();
        }

        // Show notification
        this.showNotification();

        // Update sessions if work period completed
        if (this.mode === 'work') {
            this.sessionsCompleted++;
            this.sessionCounter.textContent = this.sessionsCompleted;
            localStorage.setItem('sessionsCompleted', this.sessionsCompleted);
        }

        // Switch modes
        this.switchMode();
    }

    switchMode() {
        if (this.mode === 'work') {
            // Determine break type
            if (this.sessionsCompleted % this.settings.longBreakInterval === 0) {
                this.mode = 'longBreak';
                this.timeLeft = this.settings.longBreakDuration * 60;
            } else {
                this.mode = 'shortBreak';
                this.timeLeft = this.settings.shortBreakDuration * 60;
            }
            
            // Auto-start breaks
            if (this.settings.autoStartBreaks) {
                setTimeout(() => this.start(), 1000);
            }
        } else {
            // Switch back to work
            this.mode = 'work';
            this.timeLeft = this.settings.workDuration * 60;
            
            // Auto-start pomodoros
            if (this.settings.autoStartPomodoros) {
                setTimeout(() => this.start(), 1000);
            }
        }

        this.totalTime = this.timeLeft;
        this.updateModeDisplay();
        this.updateDisplay();
        this.updateProgress();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update document title
        document.title = `${this.timerDisplay.textContent} - Pomodoro Timer`;
    }

    updateModeDisplay() {
        const modes = {
            work: 'Work Time',
            shortBreak: 'Short Break',
            longBreak: 'Long Break'
        };
        
        this.modeDisplay.textContent = modes[this.mode];
        
        // Update body class for color theme
        document.body.className = '';
        if (this.mode === 'work') {
            document.body.classList.add('work-mode');
        } else if (this.mode === 'shortBreak') {
            document.body.classList.add('short-break-mode');
        } else {
            document.body.classList.add('long-break-mode');
        }
    }

    updateProgress() {
        const progress = this.timeLeft / this.totalTime;
        const circumference = 2 * Math.PI * 140; // radius = 140
        const offset = circumference * (1 - progress);
        this.progressCircle.style.strokeDashoffset = offset;
    }

    openSettings() {
        this.settingsModal.classList.remove('hidden');
        
        // Populate current settings
        document.getElementById('workDuration').value = this.settings.workDuration;
        document.getElementById('shortBreakDuration').value = this.settings.shortBreakDuration;
        document.getElementById('longBreakDuration').value = this.settings.longBreakDuration;
        document.getElementById('longBreakInterval').value = this.settings.longBreakInterval;
        document.getElementById('soundEnabled').checked = this.settings.soundEnabled;
        document.getElementById('autoStartBreaks').checked = this.settings.autoStartBreaks;
        document.getElementById('autoStartPomodoros').checked = this.settings.autoStartPomodoros;
    }

    closeSettings() {
        this.settingsModal.classList.add('hidden');
    }

    saveSettingsHandler() {
        // Get new settings
        this.settings.workDuration = parseInt(document.getElementById('workDuration').value);
        this.settings.shortBreakDuration = parseInt(document.getElementById('shortBreakDuration').value);
        this.settings.longBreakDuration = parseInt(document.getElementById('longBreakDuration').value);
        this.settings.longBreakInterval = parseInt(document.getElementById('longBreakInterval').value);
        this.settings.soundEnabled = document.getElementById('soundEnabled').checked;
        this.settings.autoStartBreaks = document.getElementById('autoStartBreaks').checked;
        this.settings.autoStartPomodoros = document.getElementById('autoStartPomodoros').checked;

        // Save to localStorage
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));

        // Reset timer with new settings
        this.mode = 'work';
        this.timeLeft = this.settings.workDuration * 60;
        this.totalTime = this.timeLeft;
        this.updateModeDisplay();
        this.updateDisplay();
        this.updateProgress();
        
        this.closeSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('pomodoroSettings');
        if (saved) {
            this.settings = JSON.parse(saved);
        }

        const savedSessions = localStorage.getItem('sessionsCompleted');
        if (savedSessions) {
            this.sessionsCompleted = parseInt(savedSessions);
            this.sessionCounter.textContent = this.sessionsCompleted;
        }

        // Apply initial mode
        this.updateModeDisplay();
    }

    isModalOpen() {
        return !this.settingsModal.classList.contains('hidden');
    }

    createAudioContext() {
        // Create audio context for notification sound
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playSound() {
        if (!this.audioContext) return;

        // Create a simple beep sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    showNotification() {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
            alert('Timer Complete!');
            return;
        }

        // Check notification permission
        if (Notification.permission === 'granted') {
            this.sendNotification();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.sendNotification();
                }
            });
        }
    }

    sendNotification() {
        const messages = {
            work: 'Work session complete! Time for a break.',
            shortBreak: 'Break is over! Ready to work?',
            longBreak: 'Long break is over! Ready to work?'
        };

        new Notification('Pomodoro Timer', {
            body: messages[this.mode],
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23e74c3c"/></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23e74c3c"/></svg>'
        });
    }
}

// Initialize the timer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
