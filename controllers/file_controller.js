// controllers/file_controller.js
const express = require("express");
const router = express.Router();
const path = require("path");
const models = require("../models");
const { verifyToken } = require("../utils/tokenUtils");

const dataFolderPath = path.join(__dirname, "..", "data");

async function getFileId(user_id) {
  const user = await models.User.findOne({
    attributes: ["id", "file_id"],
    where: { id: user_id },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  return user.get("file_id");
}

function errorHandler(err, req, res, next) {
  console.error("Error handling file data:", err);

  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
}

const verifyFileIdToken = (token) => {
  const decodedToken = verifyToken(token);
  if (decodedToken) {
    return decodedToken.fileId;
  } else {
    return null;
  }
};

async function getFileAndSendResponse(req, res, fileType) {
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
    let file_id;
    if (token) {
      file_id = verifyFileIdToken(token);
    }

    if (!file_id) {
      file_id = await getFileId(user_id);
    }

    const filePath = path.join(dataFolderPath, `${fileType}_${file_id}.csv.zlib`);

    console.log(
      `User ${user_id} requested ${fileType} ${file_id} ${token ? "with token" : "without token"
      }.`
    );
    res.setHeader("file_id", file_id);
    res.sendFile(filePath);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
  }
}

router.get("/get_data/:token?", async (req, res, next) => {
  await getFileAndSendResponse(req, res, "file");
});

router.get("/get_models/:token?", async (req, res, next) => {
  await getFileAndSendResponse(req, res, "models");
});

router.use(errorHandler);

module.exports = router;
