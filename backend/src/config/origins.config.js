// Allowed browser origins for CORS (HTTP) and Socket.io.
//  - FRONTEND_URL: the deployed frontend origin (set per environment)
//  - localhost regex: any port in local dev (Vite may use 5173, 5174, ...)
//  - the Vercel production URL
// The `cors` package (used by Express and Socket.io) accepts RegExp entries.
module.exports = [
  process.env.FRONTEND_URL,
  /^http:\/\/localhost:\d+$/,
  "https://byte-code-frontend.vercel.app",
].filter(Boolean);
