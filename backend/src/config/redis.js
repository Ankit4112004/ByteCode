const { createClient} = require("redis");

const client = createClient({
    username: process.env.REDIS_USER || 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
});

client.on('error', (err) => console.error('Redis Client Error:', err.message));

module.exports = client;