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

describe("when a user has no curated UserViews assignment", () => {
  test("GET /get_data falls back to the sequential file_id and logs a warning", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const user = await createUser("alice", "correct-password");
    const cookies = await login("alice", "correct-password");

    const res = await request(app).get("/get_data").set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.headers.file_id).toBe(String(user.view_index + 1));
    expect(res.headers.view_index).toBe(String(user.view_index));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/No UserViews entry/));

    warnSpy.mockRestore();
  });

  test("POST /post accepts the sequential file_id, advances view_index, and logs a warning", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await createUser("alice", "correct-password");
    const cookies = await login("alice", "correct-password");

    const res = await request(app)
      .post("/post/")
      .set("Cookie", cookies)
      .send({ file_id_user: 1, view_index_user: 0, time: [], certainty: 2 });

    expect(res.status).toBe(201);
    expect(res.body.downloadToken).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/No UserViews entry/));

    const user = await models.User.findOne({ where: { username: "alice" } });
    expect(user.view_index).toBe(1);
    expect(user.classified_file_count).toBe(1);

    const post = await models.Post.findOne({ where: { file_id: 1 } });
    expect(post).not.toBeNull();
    expect(post.certainty).toBe(2);

    warnSpy.mockRestore();
  });

  test("POST /post rejects a file_id_user that does not match the expected sequential id", async () => {
    await createUser("alice", "correct-password");
    const cookies = await login("alice", "correct-password");

    const res = await request(app)
      .post("/post/")
      .set("Cookie", cookies)
      .send({ file_id_user: 5, view_index_user: 0, time: [], certainty: 2 });

    expect(res.status).toBe(500);

    const user = await models.User.findOne({ where: { username: "alice" } });
    expect(user.view_index).toBe(0);
    expect(user.classified_file_count).toBe(0);

    const post = await models.Post.findOne({ where: { file_id: 5 } });
    expect(post).toBeNull();
  });
});

describe("when a user has a curated UserViews assignment", () => {
  test("GET /get_data honors the assigned file_id instead of the sequential fallback", async () => {
    const user = await createUser("alice", "correct-password");
    await models.UserViews.create({ user_id: user.id, file_id: 7, view_order: 0 });
    const cookies = await login("alice", "correct-password");

    const res = await request(app).get("/get_data").set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.headers.file_id).toBe("7");
  });

  test("POST /post rejects a mismatched file_id_user, then accepts the assigned one", async () => {
    const user = await createUser("alice", "correct-password");
    await models.UserViews.create({ user_id: user.id, file_id: 7, view_order: 0 });
    const cookies = await login("alice", "correct-password");

    const mismatchRes = await request(app)
      .post("/post/")
      .set("Cookie", cookies)
      .send({ file_id_user: 1, view_index_user: 0, time: [], certainty: 2 });

    expect(mismatchRes.status).toBe(500);
    expect((await models.User.findOne({ where: { username: "alice" } })).view_index).toBe(0);

    const acceptedRes = await request(app)
      .post("/post/")
      .set("Cookie", cookies)
      .send({ file_id_user: 7, view_index_user: 0, time: [], certainty: 2 });

    expect(acceptedRes.status).toBe(201);

    const reloadedUser = await models.User.findOne({ where: { username: "alice" } });
    expect(reloadedUser.view_index).toBe(1);

    const post = await models.Post.findOne({ where: { file_id: 7 } });
    expect(post).not.toBeNull();
  });
});
