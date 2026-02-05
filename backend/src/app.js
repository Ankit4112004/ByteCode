const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const main = require("./config/db");
const redisClient = require("./config/redis");

const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/aiChatting");
const videoRouter = require("./routes/videoCreator");

const app = express();

/* ================== CORS ================== */
app.use(
  cors({
    origin:true, // Allow all origins (for development; restrict in production)
    credentials: true
  })
);

/* ================== MIDDLEWARE ================== */
app.use(express.json());
app.use(cookieParser());

/* ================== ROUTES ================== */
app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);

/* ================== DB + REDIS (SAFE) ================== */
let isConnected = false;

async function init() {
  if (isConnected) return;

  await main();
//   if (!redisClient.isOpen) {
//     await redisClient.connect();
//   }

  isConnected = true;
  console.log("DB & Redis connected");
}

app.use(async (req, res, next) => {
  try {
    await init();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server init failed" });
  }
});

/* ================== EXPORT ================== */
module.exports = app;
