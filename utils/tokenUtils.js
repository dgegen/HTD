// utils/tokenUtils.js
const jwt = require("jsonwebtoken");
const config = require("../config/config.js");

function generateDownloadToken(viewIndex) {
  const secretTokenKey = config.secretTokenKey;
  const token = jwt.sign({ viewIndex }, secretTokenKey, { expiresIn: "1m" });
  return token;
}

function generateUserToken(userId) {
  const secretTokenKey = config.secretTokenKey;
  const token = jwt.sign({ userId }, secretTokenKey, { expiresIn: "24h" });
  return token;
}

function verifyToken(token) {
  let decodedToken = null;
  try {
    decodedToken = jwt.verify(token, config.secretTokenKey);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error("Token has expired:", error.message);
    } else {
      console.error("Error during authentication:", error);
    }
  }

  return decodedToken;
}

module.exports = {
  generateDownloadToken,
  generateUserToken,
  verifyToken,
};
