// conrollers/home_controller.js
var express = require("express");
const isAuthenticated = require("../utils/isAuthenticated");

// var path = require('path');
var HomeRoutes = express.Router();

HomeRoutes.get("/", function (req, res) {
  // let username = req.session.username;

  const authenticated = isAuthenticated(req);
  console.log("Is authenticated", authenticated);

  console.log("Home routes");
  // is authenticated
  res.render("home/index", { authenticated: authenticated });
});

module.exports = HomeRoutes;
