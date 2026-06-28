function handleKeyPress(event) {
  if (event.keyCode === 49) { // Key '1'
    submitWithDelay(1);
  } else if (event.keyCode === 50) { // Key '2'
    submitWithDelay(2);
  } else if (event.keyCode === 51) { // Key '3'
    submitWithDelay(3);
  } else if (event.keyCode === 102) { // Key 'f'
    toggleFullScreen();
  } else if (event.keyCode === 70) { // Key 'F'
    toggleFullScreen();
  } else if (event.keyCode === 122) { // Key 'z'
    toggleFullScreenZen();
  } else if (event.keyCode === 90) { // Key 'Z'
    toggleFullScreenZen();
  }
}

function submitWithDelay(value) {
  setTimeout(() => {
    graph.submitFunction(value);
    submissionAllowed = true; // Allow submission again after delay
  }, 100); // Wait for 100 milliseconds, in case the user clicked at the same time
}

function toggleFullScreen() {
  const chartContainer = document.getElementById('chart-container');
  if (!document.fullscreenElement) {
    chartContainer.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
    chartContainer.classList.add('fullscreen');
  } else {
    document.exitFullscreen();
    chartContainer.classList.remove('fullscreen');
  }
}

function toggleFullScreenZen() {
  const chartContainer = document.getElementById('svg-container');
  if (!document.fullscreenElement) {
    chartContainer.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
    chartContainer.classList.add('fullscreen');
  } else {
    document.exitFullscreen();
    chartContainer.classList.remove('fullscreen');
  }
}

document.addEventListener('keypress', handleKeyPress);
