// controllers/home_controller.js
const express = require("express");
const isAuthenticated = require("../utils/isAuthenticated");

const homeRoutes = express.Router();

homeRoutes.get("/", (req, res) => {
  const authenticated = isAuthenticated(req);
  console.log("Is authenticated", authenticated);
  console.log("Home routes");
  res.render("home/index", { authenticated: authenticated });
});

module.exports = homeRoutes;
