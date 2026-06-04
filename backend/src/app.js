const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRouter = require("./routes/auth.routes");
const problemRouter = require("./routes/problem.routes");
const submitRouter = require("./routes/submission.routes");
const aiRouter = require("./routes/ai.routes");
const videoRouter = require("./routes/video.routes");
const discussionRouter = require("./routes/discussion.routes");
const leaderboardRouter = require("./routes/leaderboard.routes");
const allowedOrigins = require("./config/origins.config");

const app = express();

/* ================== CORS ================== */
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

/* ================== MIDDLEWARE ================== */
app.use(express.json());
app.use(cookieParser());

/* ================== HEALTH ================== */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

/* ================== ROUTES ================== */
app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);
app.use("/discussion", discussionRouter);
app.use("/leaderboard", leaderboardRouter);

module.exports = app;
