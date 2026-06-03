// Allowed browser origins for CORS (HTTP) and Socket.io. FRONTEND_URL lets the
// deployed frontend origin be set per environment.
module.exports = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://byte-code-frontend.vercel.app",
].filter(Boolean);
