const request = require("supertest");
const app = require("../server");

describe("auth rate limiting", () => {
  test("blocks login attempts after exceeding the configured max", async () => {
    const config = require("../config/config.js");
    const maxAttempts = config.authRateLimitMax || 5;

    for (let i = 0; i < maxAttempts; i++) {
      const res = await request(app)
        .post("/login")
        .type("form")
        .send({ username: "nobody", password: "wrong" });
      expect(res.status).toBe(200);
    }

    const blockedRes = await request(app)
      .post("/login")
      .type("form")
      .send({ username: "nobody", password: "wrong" });

    expect(blockedRes.status).toBe(429);
  });
});
