// Any authenticated user. Built from the shared auth factory (see authMiddleware.js).
const createAuthMiddleware = require("./authMiddleware");

module.exports = createAuthMiddleware();
