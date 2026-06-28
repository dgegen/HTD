// controllers/classification_controller.js
const express = require("express");
const router = express.Router();
const config = require("../config/config.js");

// Route handler for /classify/classify and /classify/dark
router.get("/classify/:theme?", (req, res) => {

  const theme = req.params.theme || "classify";
  res.render(`classify/${theme}`, { minViewTimeMs: config.minViewTimeMs ?? 0 });
});

module.exports = router;
