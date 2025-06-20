const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('./userRoutes');


router.get('/api/dogs', async function(req, res, next) {
   try {
    const [dogs] = await db.execute(`
SELECT Dogs.name, Dogs.size, Users.username FROM Dogs INNER JOIN Users ON Dogs.owner_id = Users.user_id;
        `);
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});


router.get('/api/mydogs', authenticate, async function(req, res, next) {
   try {
    const [dogs] = await db.execute(`
SELECT Dogs.name, Dogs.size, Users.username FROM Dogs INNER JOIN Users ON Dogs.owner_id = Users.user_id;
        `);
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});


module.exports = router;
