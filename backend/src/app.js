const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const main = require("./config/db");

// routes
const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/aiChatting");
const videoRouter = require("./routes/videoCreator");

const app = express();

/* ================== CORS ================== */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL // frontend vercel url later
    ],
    credentials: true
  })
);

/* ================== MIDDLEWARE ================== */
app.use(express.json());
app.use(cookieParser());

/* ================== HEALTH CHECK (VERY IMPORTANT) ================== */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================== DB INIT (SAFE FOR VERCEL) ================== */
let isConnected = false;

async function initDB() {
  if (isConnected) return;
  await main(); // MongoDB only
  isConnected = true;
  console.log("DB connected");
}

/* ================== DB INIT MIDDLEWARE ================== */
app.use(async (req, res, next) => {
  // ❗ NEVER block health check
  if (req.path === "/health") return next();

  try {
    await initDB();
    next();
  } catch (err) {
    console.error("DB INIT ERROR:", err);
    res.status(500).json({ error: "Server init failed" });
  }
});

/* ================== ROUTES ================== */
app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);

module.exports = app;
