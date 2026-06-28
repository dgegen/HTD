const isAuthenticated = require("../utils/isAuthenticated");
const { generateUserToken } = require("../utils/tokenUtils");

describe("isAuthenticated", () => {
  test("returns false when there is no token cookie", () => {
    const req = { cookies: {}, signedCookies: {} };

    expect(isAuthenticated(req)).toBe(false);
  });

  test("returns false when cookies are entirely absent", () => {
    const req = {};

    expect(isAuthenticated(req)).toBe(false);
  });

  test("returns false for an invalid token", () => {
    const req = { cookies: { token: "garbage" }, signedCookies: { user_id: "1" } };

    expect(isAuthenticated(req)).toBe(false);
  });

  test("returns true when the token's userId matches the signed user_id cookie", () => {
    const token = generateUserToken(123);
    const req = { cookies: { token }, signedCookies: { user_id: "123" } };

    expect(isAuthenticated(req)).toBe(true);
  });

  test("returns false when the token's userId does not match the signed user_id cookie", () => {
    const token = generateUserToken(123);
    const req = { cookies: { token }, signedCookies: { user_id: "456" } };

    expect(isAuthenticated(req)).toBe(false);
  });
});
