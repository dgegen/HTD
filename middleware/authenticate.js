// middleware/authenticate.js
const isAuthenticated= require("../utils/isAuthenticated");

function authenticate(req, res, next) {
  if (isAuthenticated(req)) {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to the login page
    // res.redirect('/login'); // Adjust the path to your actual login route
    res.redirect("/login?errors=Please log in to get started.");
  }
}

module.exports = authenticate;
