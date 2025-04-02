// utils/isAuthenticated.js
const { verifyToken } = require("./tokenUtils");

function isAuthenticated(req) {
  // console.log("Authenticate");
  // It is not necessary to use signed cookies to store a jwt token
  // if (!req.signedCookies || !req.signedCookies.token) {
  //   console.log("No token")
  //   return false; // Cannot authenticate without a token
  // }

  // const decodedToken = verifyToken(req.signedCookies.token);
  // if (!decodedToken) {
  //   console.log("Invalid token")
  //   return false;
  // }

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
  // return String(decodedToken.userId) === req.cookies.user_id;
  // user_id size 58
  // token size 196
}

module.exports = isAuthenticated;
