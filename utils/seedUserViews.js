const config = require("../config/config.js");

async function seedUserViews(models, userId) {
  const fileCount = config.num_tutorial_files || 10;
  const userViews = [];
  for (let i = 0; i < fileCount; i++) {
    userViews.push({
      user_id: userId,
      file_id: i + 1,
      view_order: i,
    });
  }
  await models.UserViews.bulkCreate(userViews);
}

module.exports = seedUserViews;
