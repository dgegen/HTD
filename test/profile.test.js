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

describe("GET /profile", () => {
  test("redirects to /login when not authenticated", async () => {
    const res = await request(app).get("/profile");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("renders the profile page for an authenticated user", async () => {
    await createUser("alice", "correct-password");
    const cookies = await login("alice", "correct-password");

    const res = await request(app).get("/profile").set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Welcome alice!/);
  });

  test("falls back to rendering without top users when the lookup fails", async () => {
    await createUser("alice", "correct-password");
    const cookies = await login("alice", "correct-password");

    // Sequelize implements findOne via findAll internally, so mock findAll
    // selectively: only reject the "top users" query (identified by its
    // order clause), and pass everything else through to the real
    // implementation so the route's own username lookup keeps working.
    const realFindAll = models.User.findAll.bind(models.User);
    const findAllSpy = jest.spyOn(models.User, "findAll").mockImplementation((options) => {
      if (options && options.order) {
        return Promise.reject(new Error("db unavailable"));
      }
      return realFindAll(options);
    });

    // Pass the username explicitly so the route skips its own findOne
    // lookup and goes straight to the mocked top-users query.
    const res = await request(app).get("/profile?username=alice").set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Welcome alice!/);
    expect(res.text).toMatch(/No top users found/);

    findAllSpy.mockRestore();
  });
});
