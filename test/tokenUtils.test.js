const jwt = require("jsonwebtoken");
const config = require("../config/config.js");
const { generateUserToken, generateDownloadToken, verifyToken } = require("../utils/tokenUtils");

describe("tokenUtils", () => {
  test("generateUserToken produces a token verifiable with the configured secret", () => {
    const token = generateUserToken(42);
    const decoded = jwt.verify(token, config.secretTokenKey);

    expect(decoded.userId).toBe(42);
  });

  test("generateDownloadToken embeds the view index", () => {
    const token = generateDownloadToken(7);
    const decoded = jwt.verify(token, config.secretTokenKey);

    expect(decoded.viewIndex).toBe(7);
  });

  test("verifyToken returns the decoded payload for a valid token", () => {
    const token = generateUserToken(1);

    expect(verifyToken(token).userId).toBe(1);
  });

  test("verifyToken returns null for a tampered token", () => {
    const token = generateUserToken(1);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    expect(verifyToken(tampered)).toBeNull();
  });

  test("verifyToken returns null for an expired token", () => {
    const expired = jwt.sign({ userId: 1 }, config.secretTokenKey, { expiresIn: -10 });

    expect(verifyToken(expired)).toBeNull();
  });

  test("verifyToken returns null for a token signed with the wrong secret", () => {
    const wrongSecretToken = jwt.sign({ userId: 1 }, "not-the-real-secret");

    expect(verifyToken(wrongSecretToken)).toBeNull();
  });
});
