const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('./userRoutes');


router.get('/', async function(req, res) {
   try {
    const [dogs] = await db.execute(`
SELECT Dogs.name, Dogs.size, Users.username FROM Dogs INNER JOIN Users ON Dogs.owner_id = Users.user_id;
        `);
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});


router.get('/mydogs', authenticate, async function(req, res) {

   try {
    const [dogs] = await db.execute(`
SELECT Dogs.dog_id, Dogs.name, Dogs.size, Users.user_id AS owner_id, FROM Dogs INNER JOIN Users ON Dogs.owner_id = Users.user_id WHERE Users.user_id = ?;
        `, [req.session.user.id]);
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs for user' });
  }
});


module.exports = router;
