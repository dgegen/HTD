process.env.NODE_ENV = "test";

const models = require("../models");

beforeEach(async () => {
  await models.sequelize.sync({ force: true });
});

afterAll(async () => {
  await models.sequelize.close();
});
