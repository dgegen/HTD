// controllers/classification_controller.js
const express = require("express");
const router = express.Router();

// Route handler for /classify/classify and /classify/dark
router.get("/classify/:theme?", (req, res) => {

  const theme = req.params.theme || "classify";
  res.render(`classify/${theme}`);
});

module.exports = router;
