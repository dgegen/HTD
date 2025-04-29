// post_controller.js
const express = require("express");
const router = express.Router();
const models = require("../models");
const sequelize = require("sequelize");

const { generateDownloadToken } = require("../utils/tokenUtils");
const config = require("../config/config.js");
const max_file_id = config.max_file_id;

// Handle POST requests to '/post'
function handlePostRequest(user_id, file_id_user, view_index_user, time, certainty,res) {
  return new Promise(async (resolve, reject) => {
    console.log("handlePostRequest", { user_id, file_id_user, view_index_user, time, certainty });
    try {
      const user = await models.User.findOne({
        attributes: ["id", "view_index"],
        where: { id: user_id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // const file_id = user.get("file_id");
      const view_index = user.get("view_index")

      if (view_index != view_index_user) {
        // This can happen if the user was working in different active sessions
        // We will then discard this post request, as it is outdated
        console.log(
          `Discarding post request of user ${user_id}, as it is outdated `
          + `(User's file_id ${view_index_user} != ${view_index}). Update current data.`
        );
        resolve(view_index);
        return;
      }

      // const file_id = file_id_user;  // TODO: Lookup in UserViews table
      const file_id = await getUserViewIndex(user_id, view_index, file_id_user);
      console.log(
        `User ${user_id} is posting ${time.length} entries to file ${file_id} ` 
        + `with certainty ${certainty} at view index ${view_index}.`
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
      const updated_view_index = (view_index + 1);

      if (updated_view_index === max_file_id+1) {
        await updateUserViewIndex(user_id, 1);

        console.log("Resetting view index to 1");
        res.redirect("/logout");
        return;
      }
      else{
      await updateUserViewIndex(user_id, updated_view_index);

      console.log(`User ${user_id}'s posting sucessful. New file id is ${updated_view_index}.`);
      resolve(updated_view_index);}
    } catch (err) {
      console.error("Error in post:", err);
      reject(err);
    }
  });
}


async function getUserViewIndex(user_id, view_index, file_id_user) {
  const current_user_view = await models.UserViews.findOne({
    where: {
      user_id: user_id,
      view_order: view_index,
    },
  });
  if (!current_user_view) {
    throw new Error(`view_index ${view_index} not found for user ${user_id}`);
  }
  const file_id = current_user_view.get("file_id");
  if (file_id !== file_id_user) {
    throw new Error(`File ID ${file_id} does not match user's file ID ${file_id_user}`);
  }
  return file_id;
}


async function updateUserViewIndex(user_id, newViewIndex) {
  try {
    const [_, affectedRows] = await models.User.update(
      { 
        view_index: newViewIndex,
        classified_file_count: sequelize.literal('classified_file_count + 1')
      },
      { where: { id: user_id } }
    );

    if (affectedRows === 0) {
      throw new Error(`User with ID ${user_id} not found`);
    }

    return newViewIndex;
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
  
  const { time, certainty, file_id_user, view_index_user } = req.body;
  // console.log("POST request recieved at /post got", { file_id_user, time });

  try {
    const newViewIndex = await handlePostRequest(user_id, file_id_user, view_index_user, time, certainty,res);
    const downloadToken = generateDownloadToken(newViewIndex);

    res.status(201).json({ message: "Dataset created successfully", downloadToken });
  } catch (error) {
    // Pass the error to the error handling middleware
    // next(error);
    console.error("Error handling middleware:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
