const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);

client.get = util.promisify(client.get);


const exec = mongoose.Query.prototype.exec;

//Patching mongoose exec's function
mongoose.Query.prototype.exec = async function () {
  console.log('I will run before executing any query');

  //Key Creation
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }));
  console.log(key);

  //Check if we have a value for 'key' in redis
  const cachedValue = await client.get(key);

  //If we do,return that
  if (cachedValue) {
    const doc = JSON.parse(cachedValue);
    return Array.isArray(doc) ? doc.map(d => new this.model(d)) : new this.model(doc);
  }

  //Otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments);
  client.set(key, JSON.stringify(result));

  return result;
};