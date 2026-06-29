// controllers/file_controller.js
const express = require("express");
const router = express.Router();
const path = require("path");
const models = require("../models");
const { verifyToken } = require("../utils/tokenUtils");

const dataFolderPath = path.join(__dirname, "..", "data");

async function getViewIndex(user_id) {
  const user = await models.User.findOne({
    attributes: ["id", "view_index"],
    where: { id: user_id },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  return user.get("view_index");
}

function errorHandler(err, req, res, next) {
  console.error("Error handling file data:", err);

  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
}

const verifyViewIndexToken = (token) => {
  const decodedToken = verifyToken(token);
  if (decodedToken) {
    return decodedToken.viewIndex;
  } else {
    return null;
  }
};

async function getUserFileId(user_id, view_index, fileType) {
  const userViewEntry = await models.UserViews.findOne({
    where: {
      user_id: user_id,
      view_order: view_index,
    },
  });

  if (userViewEntry) {
    const file_id_lookup = userViewEntry.file_id;
    console.log(
      "Resolved to file_id:", file_id_lookup, "from user_id:", user_id, "and view_index:", view_index,
      "for fileType:", fileType
    );
    return file_id_lookup;
  }

  // No curated UserViews assignment (e.g. create_user_views.py hasn't been run for this
  // user yet, or they've classified past the end of their assigned batch). Fall back to
  // sequential files (1..max_file_id) so the user isn't blocked. Logged at warn level so
  // this is visible/greppable, since it means this user's data isn't part of the curated
  // (randomized, balanced) batch assignment.
  console.warn(
    `No UserViews entry for user_id ${user_id} at view_index ${view_index}; `
    + `falling back to sequential file_id ${view_index + 1}.`
  );
  return view_index + 1;
}

/**
 * Asynchronously retrieves a file based on the user's request and sends it as a response.
 */
async function getFileAndSendResponse(req, res, next, fileType) {
  if (!req.signedCookies || !req.signedCookies.user_id) {
    // Add ip adress of the user
    console.log("Unauthorized access to file. IP:", req.ip);
    res.status(401).json({ error: "Unauthorized access." });
    return;
  }

  const { token } = req.params;
  const user_id = req.signedCookies.user_id;
  // const user_id = req.cookies.user_id;

  try {
    let view_index;
    if (token) {
      view_index = verifyViewIndexToken(token);
    }
    if (!view_index) {
      view_index = await getViewIndex(user_id);
    }

    const file_id_lookup = await getUserFileId(user_id, view_index, fileType);
    const filePath = path.join(dataFolderPath, `${fileType}_${file_id_lookup}.csv.zlib`);

    console.log(
      `User ${user_id} requested ${fileType} ${file_id_lookup} ${token ? "with token" : "without token"}.`
    );
    res.setHeader("file_id", file_id_lookup);
    res.setHeader("view_index", view_index);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

router.get("/get_data/:token?", async (req, res, next) => {
  await getFileAndSendResponse(req, res, next, "file");
});

router.get("/get_models/:token?", async (req, res, next) => {
  await getFileAndSendResponse(req, res, next, "models");
});

router.use(errorHandler);

module.exports = router;
