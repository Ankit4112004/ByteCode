const { createClient } = require("redis");

// Single connection string (e.g. redis://default:pass@host:port or rediss:// for TLS).
const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.error('Redis Client Error:', err.message));

module.exports = client;