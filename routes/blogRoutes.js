const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');

const Blog = mongoose.model('Blog');

module.exports = app => {
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    });

    res.send(blog);
  });

  app.get('/api/blogs', requireLogin, async (req, res) => {
    const redis = require('redis');
    const redisURL = 'redis://127.0.0.1:6379';
    const client = redis.createClient(redisURL);

    const util = require('util'); // Utility module
    // Convert callback based function into promise based
    client.get = util.promisify(client.get);

    // Do we have any cached data related to this query in redis
    const cachedBlogs = await client.get(req.user.id);

    // If yes, then respond to this request right away
    if (cachedBlogs) {
      console.log(`Serving from cache`);
      return res.send(JSON.parse(cachedBlogs)); // Else not required as we return the execution
    }

    // If no, then respond to this request and update the cache
    const blogs = await Blog.find({
      _user: req.user.id
    });
    console.log(`Serving from db`);
    res.send(blogs);

    client.set(req.user.id, JSON.stringify(blogs));
  });

  app.post('/api/blogs', requireLogin, async (req, res) => {
    const {
      title,
      content
    } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
  });
};