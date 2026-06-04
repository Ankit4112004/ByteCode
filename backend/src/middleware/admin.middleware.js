// Admin-only routes. Built from the shared auth factory (see authMiddleware.js).
const createAuthMiddleware = require("./auth.middleware");

module.exports = createAuthMiddleware("admin");
