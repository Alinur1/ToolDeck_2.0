const alarmSound = new Audio("./src/assets/sounds/alarm-sound.mp3");
alarmSound.loop = true;

function checkAlarms() {
  const alarms = JSON.parse(localStorage.getItem("alarms") || "[]");

  const now = new Date();
  let hour = now.getHours();
  const minute = now.getMinutes();
  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;

  const currentTime = `${pad(hour)}:${pad(minute)} ${period}`;

  const index = alarms.findIndex(alarm => alarm === currentTime);
  if (index !== -1) {
    showAlarmPopup(currentTime);
    alarmSound.play();
    alarms.splice(index, 1); // Remove triggered alarm
    localStorage.setItem("alarms", JSON.stringify(alarms));
  }
}

function pad(num) {
  return num.toString().padStart(2, "0");
}

function showAlarmPopup(time) {
  if (document.getElementById("alarmGlobalPopup")) return;

  const popup = document.createElement("div");
  popup.id = "alarmGlobalPopup";
  popup.className = "alarm-popup";
  popup.innerHTML = `
    <p>⏰ Alarm for ${time} is ringing!</p>
    <button id="dismissAlarm">Dismiss</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("dismissAlarm").onclick = () => {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    popup.remove();
  };
}

setInterval(checkAlarms, 1000);
