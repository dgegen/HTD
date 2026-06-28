const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../server");
const models = require("../models");

async function createUser(username, password) {
  return models.User.create({
    username,
    email: "",
    password: bcrypt.hashSync(password, 10),
  });
}

describe("POST /login", () => {
  test("logs in with correct credentials and sets auth cookies", async () => {
    await createUser("alice", "correct-password");

    const res = await request(app)
      .post("/login")
      .type("form")
      .send({ username: "alice", password: "correct-password" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/profile?username=alice");
    expect(res.headers["set-cookie"].some((c) => c.startsWith("user_id="))).toBe(true);
    expect(res.headers["set-cookie"].some((c) => c.startsWith("token="))).toBe(true);
  });

  test("rejects an incorrect password", async () => {
    await createUser("alice", "correct-password");

    const res = await request(app)
      .post("/login")
      .type("form")
      .send({ username: "alice", password: "wrong-password" });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/invalid username or password/i);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  test("rejects an unknown username without throwing", async () => {
    const res = await request(app)
      .post("/login")
      .type("form")
      .send({ username: "nobody", password: "whatever-password" });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/invalid username or password/i);
  });

  test("rejects a missing username without double-rendering", async () => {
    const renderSpy = jest.spyOn(app.response, "render");
    const redirectSpy = jest.spyOn(app.response, "redirect");

    const res = await request(app).post("/login").type("form").send({ password: "whatever" });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/please enter a username/i);

    // The handler may kick off an async DB lookup even on the early-return
    // path; give any pending continuation a chance to run before asserting
    // that the response was only ever completed once.
    await new Promise((resolve) => setImmediate(resolve));

    expect(renderSpy.mock.calls.length + redirectSpy.mock.calls.length).toBe(1);

    renderSpy.mockRestore();
    redirectSpy.mockRestore();
  });
});
