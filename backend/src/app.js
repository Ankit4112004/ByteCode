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
    origin: process.env.CLIENT_URL, 
    credentials: true
  })
);

/* ================== MIDDLEWARE ================== */
app.use(express.json());
app.use(cookieParser());

/* ================== DB + REDIS INIT ================== */
let isConnected = false;

async function init() {
  if (isConnected) return;

  // ✅ MongoDB (must succeed)
  await main();

  // ✅ Redis (NON-BLOCKING)
  if (!redisClient.isOpen) {
    redisClient
      .connect()
      .then(() => console.log("Redis connected"))
      .catch(err =>
        console.error("Redis failed:", err.message)
      );
  }

  isConnected = true;
  console.log("DB init done");
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

/* ================== HEALTH ================== */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================== ROUTES ================== */
app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);

/* ================== EXPORT ================== */
module.exports = app;
