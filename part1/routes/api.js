var express = require('express');
var router = express.Router();
var db = require()

router.get('/dogs', async function(req, res, next) {
   try {
    const [books] = await db.execute('SELECT * FROM books');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

router.get('/walkrequests/open', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/walkers/summary', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
