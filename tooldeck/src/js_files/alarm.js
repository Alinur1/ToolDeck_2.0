const alarmHour = document.getElementById("alarmHour");
const alarmMinute = document.getElementById("alarmMinute");
const alarmPeriod = document.getElementById("alarmPeriod");
const setAlarmBtn = document.getElementById("setAlarmBtn");
const alarmList = document.getElementById("alarmList");
const alarmPopup = document.getElementById("alarmPopup");
const alarmText = document.getElementById("alarmText");
const dismissBtn = document.getElementById("dismissAlarm");

const alarms = [];
const alarmSound = new Audio("../assets/sounds/alarm-sound.mp3");

setAlarmBtn.addEventListener("click", () => {
  let hour = parseInt(alarmHour.value);
  let minute = parseInt(alarmMinute.value);
  let period = alarmPeriod.value;

  if (isNaN(hour) || isNaN(minute)) {
    alert("Please enter valid hour and minute.");
    return;
  }

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    alert("Please enter a valid time.");
    return;
  }

  const timeString = `${pad(hour)}:${pad(minute)} ${period}`;
  alarms.push(timeString);
  localStorage.setItem("alarms", JSON.stringify(alarms));
  displayAlarms();
});

function displayAlarms() {
    const alarms = JSON.parse(localStorage.getItem("alarms") || "[]");
    alarmList.innerHTML = "";
    alarms.forEach((alarm, index) => {
        const li = document.createElement("li");
        li.classList.add("lapList");
        li.textContent = alarm;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.classList.add("functionalButton");
    delBtn.style.marginLeft = "10px";
    delBtn.onclick = () => {
        const alarms = JSON.parse(localStorage.getItem("alarms") || "[]");
        alarms.splice(index, 1);
        localStorage.setItem("alarms", JSON.stringify(alarms));
        displayAlarms();
    };

    li.appendChild(delBtn);
    alarmList.appendChild(li);
  });
}

dismissBtn.addEventListener("click", () => {
    alarmPopup.classList.add("hidden");
    alarmSound.pause();
    alarmSound.currentTime = 0;
  });
  
  setInterval(() => {
    const now = new Date();
    let hour = now.getHours();
    const minute = now.getMinutes();
    const period = hour >= 12 ? "PM" : "AM";
  
    hour = hour % 12;
    hour = hour === 0 ? 12 : hour;
  
    const currentTime = `${pad(hour)}:${pad(minute)} ${period}`;
  
    if (alarms.includes(currentTime)) {
      const idx = alarms.indexOf(currentTime);
      if (idx !== -1) alarms.splice(idx, 1);
      displayAlarms();
  
      // 🔔 Play sound & show popup
      alarmSound.play();
      alarmText.textContent = `⏰ Alarm for ${currentTime} is ringing!`;
      alarmPopup.classList.remove("hidden");
    }
  }, 1000);

function pad(num) {
  return num.toString().padStart(2, "0");
}
