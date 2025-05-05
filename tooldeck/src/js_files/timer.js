let totalSeconds = 0;
let interval = null;
let isRunning = false;

const display = document.getElementById("countdownDisplay");
const daysInput = document.getElementById("days");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");

const startStopBtn = document.getElementById("startStopBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

startStopBtn.addEventListener("click", () => {
  if (!isRunning) {
    startTimer();
  } else {
    stopTimer();
  }
});

pauseBtn.addEventListener("click", () => {
  if (isRunning) {
    clearInterval(interval);
    isRunning = false;
    startStopBtn.textContent = "Start";
  }
});

resetBtn.addEventListener("click", () => {
  clearInterval(interval);
  isRunning = false;
  totalSeconds = 0;
  startStopBtn.textContent = "Start";
  display.textContent = "";
  daysInput.value = "";
  hoursInput.value = "";
  minutesInput.value = "";
  secondsInput.value = "";
});

function startTimer() {
  const days = parseInt(daysInput.value) || 0;
  const hours = parseInt(hoursInput.value) || 0;
  const minutes = parseInt(minutesInput.value) || 0;
  const seconds = parseInt(secondsInput.value) || 0;

  totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;

  if (totalSeconds <= 0) {
    display.textContent = "Please enter a valid time.";
    return;
  }

  isRunning = true;
  startStopBtn.textContent = "Stop";

  interval = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(interval);
      display.textContent = "Time's up!";
      isRunning = false;
      startStopBtn.textContent = "Start";
      return;
    }

    totalSeconds--;
    display.textContent = formatTime(totalSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);
  isRunning = false;
  totalSeconds = 0;
  display.textContent = "";
  startStopBtn.textContent = "Start";
}

function formatTime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

function pad(num) {
  return num.toString().padStart(2, "0");
}
