function updateClock() {
    const now = new Date();
  
    // Format time
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const isPM = hours >= 12;
    hours = hours % 12 || 12;
  
    const formattedTime = `${hours}:${pad(minutes)}:${pad(seconds)} ${isPM ? 'PM' : 'AM'}`;
    
    // Format date
    const day = now.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
  
    // Format day of week
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekday = weekdayNames[now.getDay()];
  
    document.getElementById("time").textContent = formattedTime;
    document.getElementById("date").textContent = formattedDate;
    document.getElementById("day").textContent = weekday;
  }
  
  function pad(num) {
    return num.toString().padStart(2, '0');
  }
  
  setInterval(updateClock, 1000);
  updateClock(); // initial call
  