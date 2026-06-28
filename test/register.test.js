const request = require("supertest");
const app = require("../server");
const models = require("../models");

describe("POST /register", () => {
  test("creates a new user and sets auth cookies", async () => {
    const res = await request(app)
      .post("/register")
      .type("form")
      .send({ username: "alice", email: "alice@example.com", password: "correct-password" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/profile?username=alice");
    expect(res.headers["set-cookie"].some((c) => c.startsWith("user_id="))).toBe(true);
    expect(res.headers["set-cookie"].some((c) => c.startsWith("token="))).toBe(true);

    const user = await models.User.findOne({ where: { username: "alice" } });
    expect(user).not.toBeNull();
    expect(user.password).not.toBe("correct-password");
  });

  test("rejects a duplicate username", async () => {
    await models.User.create({ username: "bob", email: "", password: "hashed" });

    const res = await request(app)
      .post("/register")
      .type("form")
      .send({ username: "bob", email: "", password: "correct-password" });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/already in use|already in user/i);

    const matches = await models.User.findAll({ where: { username: "bob" } });
    expect(matches).toHaveLength(1);
  });

  test("rejects a password that is too short", async () => {
    const res = await request(app)
      .post("/register")
      .type("form")
      .send({ username: "carol", email: "", password: "short" });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/between 8 and 72 characters/i);

    const user = await models.User.findOne({ where: { username: "carol" } });
    expect(user).toBeNull();
  });

  test("rejects a password that is too long", async () => {
    const res = await request(app)
      .post("/register")
      .type("form")
      .send({ username: "dave", email: "", password: "a".repeat(73) });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/between 8 and 72 characters/i);

    const user = await models.User.findOne({ where: { username: "dave" } });
    expect(user).toBeNull();
  });
});
