// utils/isAuthenticated.js
const { verifyToken } = require("./tokenUtils");

function isAuthenticated(req) {
  if (!req.cookies || !req.cookies.token) {
    console.log("No token")
    return false; // Cannot authenticate without a token
  }

  const decodedToken = verifyToken(req.cookies.token);
  if (!decodedToken) {
    console.log("Invalid token")
    return false;
  }

  console.debug("Authenticated:", String(decodedToken.userId) === req.signedCookies.user_id);

  return String(decodedToken.userId) === req.signedCookies.user_id;
}

module.exports = isAuthenticated;
