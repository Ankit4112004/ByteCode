const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const redisClient = require("../config/redis.config");

/**
 * Factory pattern: builds an auth middleware. Pass a required role to gate a
 * route (e.g. 'admin'); pass nothing for any logged-in user.
 *
 * Replaces the two near-identical userMiddleware / adminMiddleware files —
 * the only difference between them was a single role check.
 */
const createAuthMiddleware = (requiredRole = null) => async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) throw new Error("Token is not present");

    const payload = jwt.verify(token, process.env.JWT_KEY);

    const { _id } = payload;
    if (!_id) throw new Error("Invalid token");

    // Role gate (admin routes). JWT is signed server-side, so payload.role is trusted.
    if (requiredRole && payload.role !== requiredRole) {
      throw new Error("Unauthorized");
    }

    const result = await User.findById(_id);
    if (!result) throw new Error("User Doesn't Exist");

    // Redis blocklist check (set on logout). Fail-open: if Redis is unreachable,
    // don't lock out valid users — the JWT signature + expiry already authenticated them.
    try {
      const isBlocked = await redisClient.exists(`token:${token}`);
      if (isBlocked) throw new Error("Invalid Token");
    } catch (redisErr) {
      if (redisErr.message === "Invalid Token") throw redisErr;
      console.error("Redis unavailable, skipping blocklist check:", redisErr.message);
    }

    req.result = result;
    next();
  } catch (err) {
    res.status(401).send("Error: " + err.message);
  }
};

module.exports = createAuthMiddleware;
