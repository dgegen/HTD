// controllers/classification_controller.js
const express = require("express");
const user = require("../models/user");
const router = express.Router();

// Route handler for /classify/classify and /classify/dark
router.get("/classify/:theme?", (req, res) => {

  const theme = req.params.theme || "classify";
  if(theme === "tutorial"){
    res.render(`classify/tutorial`);
    return;
  }
  const user_id = req.signedCookies.user_id;
  console.log("User ID:", user_id);
  const nr_users= 4; // This should be replaced with the actual number of users in the database
  if (user_id < Math.floor(nr_users/2) ){
  res.render(`classify/${theme}`);
  } 
  else { //show the Probability panel
    res.render(`classify/${theme}_NNshow`);}
});

module.exports = router;
