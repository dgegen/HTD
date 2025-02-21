
function toggleInfoPopup() {
  var infoPopup = document.getElementById("info-popup");
  infoPopup.style.display = infoPopup.style.display === "block" ? "none" : "block";
}


function openInfoPopup() {
  document.getElementById("info-popup").style.display = "block";
}

function closeInfoPopup() {
  document.getElementById("info-popup").style.display = "none";
}