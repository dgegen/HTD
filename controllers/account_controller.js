const express = require("express");
const models = require("../models");
const Sequelize = require("sequelize");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const isAuthenticated = require("../utils/isAuthenticated");

const { generateUserToken } = require("../utils/tokenUtils");
const config = require("../config/config.js");
const seedUserViews = require("../utils/seedUserViews");

const accountRoutes = express.Router();

const authRateLimiter = rateLimit({
  windowMs: config.authRateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
  max: config.authRateLimitMax || 5, // attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many attempts. Please try again later.",
});

accountRoutes.get("/login", (req, res) => {
  const errorMessage = req.query.errors || "";
  res.render("account/login", { error: errorMessage });
});

accountRoutes.get("/register", (req, res) => {
  if (config.registrationEnabled === false) {
    return res.redirect("/login?errors=Registration is currently disabled.");
  }
  res.render("account/register", { errors: "" });
});

accountRoutes.post("/register", authRateLimiter, async (req, res) => {
  if (config.registrationEnabled === false) {
    return res.redirect("/login?errors=Registration is currently disabled.");
  }
  const email = req.body.email || "";
  const password = req.body.password || "";

  if (password.length < 8 || password.length > 72) {
    return res.render("account/register", {
      errors: "Password must be between 8 and 72 characters.",
    });
  }

  try {
    const queryCond = !email || email.length === 0
      ? { username: req.body.username }
      : Sequelize.or({ username: req.body.username }, { email: email });

    const users = await models.User.findAll({
      where: queryCond,
    });

    if (users.length === 0) {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await models.User.create({
        username: req.body.username,
        email: email,
        password: passwordHash,
      });

      if (process.env.NODE_ENV === "development") {
        // Seed mock user views so the user can immediately classify files locally
        try {
          await seedUserViews(models, user.id);
          console.log(`Seeded default UserViews for registered user: ${user.username}`);
        } catch (err) {
          console.error("Error seeding UserViews on registration:", err);
        }
      }
      setCookies(res, user.id);
      return res.redirect("/profile?username=" + encodeURIComponent(req.body.username));
    } else {
      return res.render("account/register", { errors: "Username or Email already in use" });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    return res.render("account/register", { errors: "An error occurred. Please try again." });
  }
});

accountRoutes.post("/login", authRateLimiter, async (req, res) => {
  if (req.body.username == null || req.body.username.length === 0) {
    return handleUnsuccessfulLogin(res, "Please enter a username.");
  }

  try {
    const user = await models.User.findOne({
      where: { username: req.body.username },
    });

    const isValid = await isValidPassword(user, req.body.password);
    if (isValid) {
      setCookies(res, user.id);
      return res.redirect("/profile?username=" + encodeURIComponent(req.body.username));
    } else {
      return handleUnsuccessfulLogin(res);
    }
  } catch (error) {
    console.error("Error during login:", error);
    return handleUnsuccessfulLogin(res);
  }
});

function handleUnsuccessfulLogin(res, errorMessage = "Invalid username or password.") {
  res.render("account/login", { error: errorMessage });
}

// Precomputed bcrypt hash of a fixed dummy string, used to keep comparison
// timing constant whether or not the username exists.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const isValidPassword = async (user, enteredPassword) => {
  if (!user) {
    await bcrypt.compare(enteredPassword, DUMMY_PASSWORD_HASH);
    return false;
  }
  return bcrypt.compare(enteredPassword, user.password);
};

const setCookies = (res, userId) => {
  // Cookie expires in 86400000 ms = 24 hours
  console.log("Set cookies");
  res.cookie("user_id", userId, { signed: true, httpOnly: true, sameSite: "strict", secure: true });
  res.cookie("token", generateUserToken(userId), {
    signed: false,
    httpOnly: true,
    maxAge: 86400000,
    sameSite: "strict",
    secure: true,
  });
};

async function getTopUsers(limit = 10) {
  try {
    const topUsers = await models.User.findAll({
      attributes: ["username", "classified_file_count"],
      order: [["classified_file_count", "DESC"]],
      limit: limit,
    });
    return topUsers;
  } catch (error) {
    console.error("Error fetching top users:", error);
    throw error;
  }
}

accountRoutes.get("/profile", async (req, res) => {
  const authenticated = isAuthenticated(req);
  console.log("Authenticated:", authenticated);
  if (!authenticated) {
    res.redirect("/login");
  } else {
    let username = req.query.username; // Get username from query parameters
    if (!username) {
      const user = await models.User.findOne({ where: { id: req.signedCookies.user_id } });
      username = user.username;
    }
    try {
      const topUsers = await getTopUsers(10);
      res.render("profile/profile", { username: username, topUsers: topUsers });
    } catch (error) {
      console.error("Error fetching top users:", error);
      res.render("profile/profile", { username: username, topUsers: [] });
    }
  }
});

accountRoutes.get("/logout", (req, res) => {
  // Clear cookies
  res.clearCookie("user_id");
  res.clearCookie("token");
  res.render("account/logout-success");
});

module.exports = accountRoutes;