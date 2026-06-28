const request = require("supertest");

const app = require("../server");

describe("GET /logout", () => {
  test("clears auth cookies and renders the logout page", async () => {
    const res = await request(app)
      .get("/logout")
      .set("Cookie", ["user_id=abc", "token=def"]);

    expect(res.status).toBe(200);

    const clearedCookies = res.headers["set-cookie"];
    expect(clearedCookies.some((c) => c.startsWith("user_id=;"))).toBe(true);
    expect(clearedCookies.some((c) => c.startsWith("token=;"))).toBe(true);
  });
});
