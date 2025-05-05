let startTime = 0;
let elapsed = 0;
let timerInterval = null;
let isRunning = false;

const display = document.getElementById("stopwatchDisplay");
const startStopBtn = document.getElementById("startStopBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const lapBtn = document.getElementById("lapBtn");
const lapList = document.getElementById("lapTimes");

startStopBtn.addEventListener("click", () => {
  if (!isRunning) {
    startStopwatch();
  } else {
    stopStopwatch();
  }
});

pauseBtn.addEventListener("click", () => {
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
    elapsed += Date.now() - startTime;
    startStopBtn.textContent = "Start";
  }
});

resetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  isRunning = false;
  startTime = 0;
  elapsed = 0;
  display.textContent = "00:00:00.000";
  lapList.innerHTML = "";
  startStopBtn.textContent = "Start";
});

lapBtn.addEventListener("click", () => {
    if (!isRunning) return;  
    const lapTime = formatTime(Date.now() - startTime + elapsed);
    const li = document.createElement("li");
    li.textContent = lapTime;
    lapList.appendChild(li);
  });
  

function startStopwatch() {
  startTime = Date.now();
  isRunning = true;
  startStopBtn.textContent = "Stop";

  timerInterval = setInterval(() => {
    const time = Date.now() - startTime + elapsed;
    display.textContent = formatTime(time);
  }, 10);
}

function stopStopwatch() {
  clearInterval(timerInterval);
  isRunning = false;
  elapsed += Date.now() - startTime;
  startStopBtn.textContent = "Start";
}

function formatTime(ms) {
  const milliseconds = ms % 1000;
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

function pad(num, digits = 2) {
  return num.toString().padStart(digits, "0");
}
