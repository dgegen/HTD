// post_controller.js
const express = require("express");
const router = express.Router();
const models = require("../models");
const sequelize = require("sequelize");

const { generateDownloadToken } = require("../utils/tokenUtils");
const config = require("../config/config.js");
const max_file_id = config.max_file_id;

// Handle POST requests to '/post'
function handlePostRequest(user_id, file_id_user, time, certainty) {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await models.User.findOne({
        attributes: ["id", "file_id"],
        where: { id: user_id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const file_id = user.get("file_id");

      if (file_id != file_id_user) {
        // This can happen if the user was working in different active sessions
        // We will then discard this post request, as it is outdated
        console.log(
          `Discarding post request of user ${user_id}, as it is outdated (User's file_id ${file_id_user} != ${file_id}). Update current data.`
        );
        resolve(file_id);
        return;
      }

      console.log(
        `User ${user_id} is posting ${time.length} entries to file ${file_id} (${file_id_user}) with certainty ${certainty}`
      );

      if (time.length === 0) {
        await models.Post.create({
          file_id: parseInt(file_id, 10),
          time: null,
          user_id: parseInt(user_id, 10),
          certainty: parseInt(certainty, 10),
        });
      } else {
        for (const t of time) {
          await models.Post.create({
            file_id: parseInt(file_id, 10),
            time: t,
            user_id: parseInt(user_id, 10),
            certainty: parseInt(certainty, 10),
          });
        }
      }

      const updated_file_id = (file_id + 1) % max_file_id;
      await updateUserFileId(user_id, updated_file_id);

      console.log(`User ${user_id}'s posting sucessful. New file id is ${updated_file_id}.`);
      resolve(updated_file_id);
    } catch (err) {
      console.error("Error in post:", err);
      reject(err);
    }
  });
}

async function updateUserFileId(user_id, newFileId) {
  try {
    const [_, affectedRows] = await models.User.update(
      { 
        file_id: newFileId,
        classified_file_count: sequelize.literal('classified_file_count + 1')
      },
      { where: { id: user_id } }
    );

    if (affectedRows === 0) {
      throw new Error(`User with ID ${user_id} not found`);
    }

    return newFileId;
  } catch (error) {
    console.error("Error updating user's file_id:", error);
    throw error;
  }
}

router.post("/post/", async (req, res) => {
  if (!req.signedCookies || !req.signedCookies.user_id) {
    res.status(401).json({ error: "Unauthorized access. Login first." });
    return;
  }

  const user_id = req.signedCookies.user_id;
  
  const { time, certainty, file_id_user } = req.body;
  // console.log("POST request recieved at /post got", { file_id_user, time });

  try {
    const newFileId = await handlePostRequest(user_id, file_id_user, time, certainty);
    const downloadToken = generateDownloadToken(newFileId);

    res.status(201).json({ message: "Dataset created successfully", downloadToken });
  } catch (error) {
    // Pass the error to the error handling middleware
    // next(error);
    console.error("Error handling middleware:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
