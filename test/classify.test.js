const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../server");
const models = require("../models");
const config = require("../config/config.js");

async function createUser(username, password) {
  return models.User.create({
    username,
    email: "",
    password: bcrypt.hashSync(password, 10),
  });
}

// supertest's cookie jar drops cookies marked Secure when the test request
// is plain HTTP, so log in and forward the Set-Cookie values by hand rather
// than relying on request.agent() to persist them automatically.
async function login(username, password) {
  const res = await request(app)
    .post("/login")
    .type("form")
    .send({ username, password });

  return res.headers["set-cookie"].map((cookie) => cookie.split(";")[0]);
}

describe("GET /classify/:theme?", () => {
  test("redirects to /login when not authenticated", async () => {
    const res = await request(app).get("/classify");

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/^\/login/);
  });

  test.each([
    ["/classify", "Submission"],
    ["/classify/dark", "Submission"],
    ["/classify/tutorial", "Submission"],
  ])("renders %s for an authenticated user", async (path, expectedText) => {
    await createUser("alice", "correct-password");
    const cookies = await login("alice", "correct-password");

    const res = await request(app).get(path).set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.text).toContain(expectedText);
  });

  test("injects the configured minimum view time into the chart container", async () => {
    await createUser("alice", "correct-password");
    const cookies = await login("alice", "correct-password");

    const res = await request(app).get("/classify").set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.text).toContain(`data-min-view-time-ms="${config.minViewTimeMs}"`);
  });

  test("falls back to a minimum view time of 0 when unset in config", async () => {
    const originalValue = config.minViewTimeMs;
    delete config.minViewTimeMs;

    try {
      await createUser("alice", "correct-password");
      const cookies = await login("alice", "correct-password");

      const res = await request(app).get("/classify").set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.text).toContain('data-min-view-time-ms="0"');
    } finally {
      config.minViewTimeMs = originalValue;
    }
  });
});
