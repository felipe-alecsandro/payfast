var redis = require('redis');

function createRedisClient(){
    var client = new redis.createClient();
    return client;
}

module.exports = function(){
    return createRedisClient;
}