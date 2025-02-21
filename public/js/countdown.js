// public/js/countdown.js

const countdownElement = document.getElementById("countdown");
let countdownValue = 10;
let countdownInterval;
let blinkInterval;

function startCountdown() {
  countdownInterval = setInterval(() => {
    countdownElement.textContent = countdownValue;
    if (countdownValue === 0) {
      clearInterval(countdownInterval);
      startBlinking();
    }

    countdownValue--;
  }, 1000);
}

function startBlinking() {
  blinkInterval = setInterval(() => {
    countdownElement.style.visibility =
      countdownElement.style.visibility === "hidden" ? "visible" : "hidden";
  }, 500);
}

function resetTimer() {
  clearInterval(countdownInterval);
  clearInterval(blinkInterval);
  countdownValue = 10;
  countdownElement.style.visibility = "visible";
  startCountdown();
}

// Expose resetTimer globally
window.resetTimer = resetTimer;

// Start countdown when the entire page is fully loaded
window.onload = startCountdown;
