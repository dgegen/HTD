function addStars(density = 0.003) {
  const totalStars = Math.floor(window.innerWidth * window.innerHeight * density);

  for (let i = 0; i < totalStars; i++) {
    createStar();
  }
}

function createStar() {
  const star = document.createElement("div");
  star.className = "star";
  const hw = `${Math.random() * 3}px`;
  // limit the stars position to the screen sides first 5% and last 5%?
  // left = left < 0.5 ? left*2*5 : 95 + (1-left)*2*5;

  star.style.top = `${Math.random() * 100}%`;
  star.style.left = `${Math.random() * 100}%`;
  star.style.width = hw;
  star.style.height = hw;
  star.style.opacity = `${0.5 + Math.random() * 0.5}`;

  document.querySelector(".stars").appendChild(star);
}

addStars(0.003);
