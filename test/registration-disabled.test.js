const request = require("supertest");
const app = require("../server");
const config = require("../config/config.js");
const models = require("../models");

describe("when registration is disabled", () => {
  let originalValue;

  beforeEach(() => {
    originalValue = config.registrationEnabled;
    config.registrationEnabled = false;
  });

  afterEach(() => {
    config.registrationEnabled = originalValue;
  });

  test("GET /register redirects to /login with an error", async () => {
    const res = await request(app).get("/register");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login?errors=Registration%20is%20currently%20disabled.");
  });

  test("POST /register redirects to /login without creating a user", async () => {
    const res = await request(app)
      .post("/register")
      .type("form")
      .send({ username: "eve", email: "", password: "correct-password" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login?errors=Registration%20is%20currently%20disabled.");

    const user = await models.User.findOne({ where: { username: "eve" } });
    expect(user).toBeNull();
  });
});
