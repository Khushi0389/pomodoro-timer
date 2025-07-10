window.addEventListener('DOMContentLoaded', () => {
  const themeSelect    = document.getElementById('themeSelect');
  const pomodoroToggle = document.getElementById('pomodoroMode');
  const durationSelect = document.getElementById('durationSelect');
  const customInput    = document.getElementById('customDuration');
  const longBreakInput = document.getElementById('longBreakInput');
  const startBtn       = document.getElementById('startBtn');
  const pauseBtn       = document.getElementById('pauseBtn');
  const resetBtn       = document.getElementById('resetBtn');
  const display        = document.querySelector('.timer-display');
  const popup          = document.getElementById('donePopup');
  const popupText      = document.getElementById('popupText');
  const closePopup     = document.getElementById('closePopup');
  const modeLabel      = document.getElementById('modeLabel');
  const cycleLabel     = document.getElementById('cycleLabel');
  const ding           = document.getElementById('dingSound');
  const windowElem     = document.querySelector('.window');

  let timerInterval,
      remaining = 0,
      audioUnlocked = false,
      workCount = 0;

  // --- Persist & load theme ---
  const savedTheme = localStorage.getItem('timerTheme');
  if (savedTheme) {
    document.body.className = 'theme-' + savedTheme;
    themeSelect.value = savedTheme;
  }
  themeSelect.addEventListener('change', () => {
    const th = themeSelect.value;
    document.body.className = 'theme-' + th;
    localStorage.setItem('timerTheme', th);
  });

  // --- Persist & load Pomodoro toggle ---
  const savedPom = localStorage.getItem('timerPomodoro') === 'true';
  pomodoroToggle.checked = savedPom;
  pomodoroToggle.addEventListener('change', () => {
    localStorage.setItem('timerPomodoro', pomodoroToggle.checked);
  });

  // --- Persist & load initial duration ---
  const savedSel    = localStorage.getItem('timerDurationSel');
  const savedCustom = localStorage.getItem('timerDurationCustom');
  if (savedSel) {
    durationSelect.value = savedSel;
    if (savedSel === '0') {
      customInput.style.display = 'inline-block';
      customInput.value = savedCustom || '';
    }
  }
  durationSelect.addEventListener('change', () => {
    localStorage.setItem('timerDurationSel', durationSelect.value);
    if (durationSelect.value === '0') {
      customInput.style.display = 'inline-block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
    }
  });
  customInput.addEventListener('input', () => {
    localStorage.setItem('timerDurationCustom', customInput.value);
  });

  // --- Persist & load long-break length ---
  const savedLong = localStorage.getItem('timerLongBreak');
  if (savedLong) longBreakInput.value = savedLong;
  longBreakInput.addEventListener('input', () => {
    localStorage.setItem('timerLongBreak', longBreakInput.value);
  });

  // format mm:ss
  function formatTime(sec) {
    const m = String(Math.floor(sec/60)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    return `${m}:${s}`;
  }

  // notification permission
  function ensureNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Start
  startBtn.addEventListener('click', () => {
    ensureNotifications();
    if (!audioUnlocked) {
      ding.play().then(() => {
        ding.pause(); ding.currentTime = 0;
      }).catch(console.warn);
      audioUnlocked = true;
    }

    if (!remaining) {
      const val = Number(durationSelect.value);
      remaining = val === 0
        ? (Number(customInput.value) || 25) * 60
        : val;
    }

    modeLabel.textContent = pomodoroToggle.checked ? 'Work' : 'Session';
    windowElem.classList.add('running');
    runTimer();
  });

  function runTimer() {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    display.textContent = formatTime(remaining);

    timerInterval = setInterval(() => {
      remaining--;
      display.textContent = formatTime(remaining);

      if (remaining <= 0) {
        clearInterval(timerInterval);
        ding.play();

        // Pomodoro logic
        if (pomodoroToggle.checked) {
          if (modeLabel.textContent === 'Work') {
            // just finished a work session
            workCount++;
            cycleLabel.textContent = `Cycles: ${workCount}`;
            // determine break length
            const lb = Number(longBreakInput.value) || 15;
            const isLong = workCount % 4 === 0;
            remaining = (isLong ? lb : 5) * 60;
            popupText.textContent = isLong
              ? '🍵 Time for a long break!'
              : '☕ Time for a short break!';
            modeLabel.textContent = isLong ? 'Long Break' : 'Short Break';
          } else {
            // just finished a break
            remaining = Number(durationSelect.value) === 0
              ? (Number(customInput.value) || 25) * 60
              : Number(durationSelect.value);
            popupText.textContent = '💼 Back to work!';
            modeLabel.textContent = 'Work';
          }
        } else {
          // non-pomodoro
          popupText.textContent = '✨ Time’s up! ✨';
          modeLabel.textContent = 'Idle';
        }

        // notify
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(popupText.textContent, {
            body: modeLabel.textContent,
            icon: 'ding.png'
          });
        } else {
          popup.style.display = 'block';
        }

        // auto‐continue if pomodoro
        if (pomodoroToggle.checked) runTimer();
      }
    }, 1000);
  }

  // Pause
  pauseBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    windowElem.classList.remove('running');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    windowElem.classList.remove('running');
    remaining = 0; workCount = 0;
    cycleLabel.textContent = 'Cycles: 0';
    modeLabel.textContent = 'Idle';
    display.textContent = '25:00';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
  });

  // Close popup
  closePopup.addEventListener('click', () => {
    popup.style.display = 'none';
  });
});
