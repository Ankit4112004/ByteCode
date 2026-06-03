// Admin-only routes. Built from the shared auth factory (see authMiddleware.js).
const createAuthMiddleware = require("./authMiddleware");

module.exports = createAuthMiddleware("admin");
