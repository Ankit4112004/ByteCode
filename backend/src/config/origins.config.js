
module.exports = [
  process.env.FRONTEND_URL,
  /^http:\/\/localhost:\d+$/,
  "https://byte-code-frontend.vercel.app",
].filter(Boolean);
