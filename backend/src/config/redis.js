const { createClient} = require("redis");

const client = createClient({
    username: 'default',
    password:process.env.REDIS_PASS,
    socket: {
        host: 'redis-16373.crce182.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 16373
    }
});

module.exports = client;