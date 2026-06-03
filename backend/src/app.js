const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/aiChatting");
const videoRouter = require("./routes/videoCreator");
const discussionRouter = require("./routes/discussion");
const leaderboardRouter = require("./routes/leaderboard");
const allowedOrigins = require("./config/origins");

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
