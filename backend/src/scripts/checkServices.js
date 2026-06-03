/**
 * Service connectivity check.
 *
 * Pings every external dependency the API needs and prints a pass/fail
 * summary. Run after refreshing credentials to confirm which services are
 * live before redeploying.
 *
 *   cd backend
 *   node src/scripts/checkServices.js
 *   (or: npm run check-services)
 *
 * Reads credentials from backend/.env (same vars the app uses).
 */

require('dotenv').config();

const axios = require('axios');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const cloudinary = require('cloudinary').v2;

const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail });

async function checkMongo() {
  const uri = process.env.DB_CONNECT_STRING;
  if (!uri) return record('MongoDB', false, 'DB_CONNECT_STRING not set');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    await mongoose.connection.db.admin().ping();
    record('MongoDB', true, `connected (${mongoose.connection.host})`);
  } catch (err) {
    record('MongoDB', false, err.message);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

async function checkRedis() {
  const { REDIS_HOST, REDIS_PORT, REDIS_PASS } = process.env;
  if (!REDIS_HOST || !REDIS_PORT) {
    return record('Redis', false, 'REDIS_HOST / REDIS_PORT not set');
  }
  const client = createClient({
    username: process.env.REDIS_USER || 'default',
    password: REDIS_PASS,
    socket: { host: REDIS_HOST, port: Number(REDIS_PORT), connectTimeout: 8000 },
  });
  client.on('error', () => {}); // swallow; we report via the await below
  try {
    await client.connect();
    const pong = await client.ping();
    record('Redis', true, `${pong} (${REDIS_HOST}:${REDIS_PORT})`);
  } catch (err) {
    record('Redis', false, err.message);
  } finally {
    await client.quit().catch(() => {});
  }
}

async function checkCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return record('Cloudinary', false, 'CLOUDINARY_* vars not set');
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  try {
    const res = await cloudinary.api.ping();
    record('Cloudinary', res.status === 'ok', `status: ${res.status}`);
  } catch (err) {
    record('Cloudinary', false, err.error?.message || err.message);
  }
}

async function checkJudge0() {
  const key = process.env.JUDGE0_KEY;
  if (!key) return record('Judge0', false, 'JUDGE0_KEY not set');
  try {
    const res = await axios.get('https://judge0-ce.p.rapidapi.com/languages', {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
      },
      timeout: 8000,
    });
    record('Judge0', Array.isArray(res.data), `${res.data.length} languages available`);
  } catch (err) {
    record('Judge0', false, err.response?.status ? `HTTP ${err.response.status}` : err.message);
  }
}

async function checkOpenRouter() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return record('OpenRouter', false, 'OPENROUTER_API_KEY not set');
  try {
    const res = await axios.get('https://openrouter.ai/api/v1/key', {
      headers: { Authorization: `Bearer ${key}` },
      timeout: 8000,
    });
    const limit = res.data?.data?.limit_remaining;
    record('OpenRouter', true, limit != null ? `credits remaining: ${limit}` : 'key valid');
  } catch (err) {
    record('OpenRouter', false, err.response?.status ? `HTTP ${err.response.status}` : err.message);
  }
}

(async () => {
  console.log('\nChecking ByteCode external services...\n');
  await Promise.all([
    checkMongo(),
    checkRedis(),
    checkCloudinary(),
    checkJudge0(),
    checkOpenRouter(),
  ]);

  for (const r of results) {
    const tag = r.ok ? 'OK  ' : 'FAIL';
    console.log(`[${tag}] ${r.name.padEnd(11)} ${r.detail}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} services reachable.`);
  if (failed.length) {
    console.log('Needs attention: ' + failed.map((r) => r.name).join(', '));
  }
  process.exit(failed.length ? 1 : 0);
})();
