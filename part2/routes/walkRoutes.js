const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('./userRoutes');

// GET all walk requests (for walkers to view, if an owner then only fetch dogs they own)
router.get('/', authenticate, async (req, res) => {

  // If you are an owner, only show walks for dogs belonging to you
  if(req.session.user.role === 'owner') {

     try {
      const [rows] = await db.query(`
        SELECT wr.*, d.name AS dog_name, d.size, u.username AS owner_name
        FROM WalkRequests wr
        JOIN Dogs d ON wr.dog_id = d.dog_id
        JOIN Users u ON d.owner_id = u.user_id
        WHERE wr.status = 'open' AND u.user_id = ?;
      `, [req.session.user.id]);
      res.json(rows);
    } catch (error) {
      console.error('SQL Error:', error);
      res.status(500).json({ error: 'Failed to fetch walk requests' });
    }

  } else {

    // Otherwise this is a walker, we are all good to show every dog

    try {
      const [rows] = await db.query(`
        SELECT wr.*, d.name AS dog_name, d.size, u.username AS owner_name
        FROM WalkRequests wr
        JOIN Dogs d ON wr.dog_id = d.dog_id
        JOIN Users u ON d.owner_id = u.user_id
        WHERE wr.status = 'open'
      `);
      res.json(rows);
    } catch (error) {
      console.error('SQL Error:', error);
      res.status(500).json({ error: 'Failed to fetch walk requests' });
    }

  }
});

// POST a new walk request (from owner)
router.post('/', authenticate, async (req, res) => {
  const { dog_id, requested_time, duration_minutes, location } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location)
      VALUES (?, ?, ?, ?)
    `, [dog_id, requested_time, duration_minutes, location]);

    res.status(201).json({ message: 'Walk request created', request_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create walk request' });
  }
});

// POST an application to walk a dog (from walker)
router.post('/:id/apply', authenticate, async (req, res) => {
  const requestId = req.params.id;
  const { walker_id } = req.body;

  try {
    await db.query(`
      INSERT INTO WalkApplications (request_id, walker_id)
      VALUES (?, ?)
    `, [requestId, walker_id]);

    await db.query(`
      UPDATE WalkRequests
      SET status = 'accepted'
      WHERE request_id = ?
    `, [requestId]);

    res.status(201).json({ message: 'Application submitted' });
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to apply for walk' });
  }
});

module.exports = router;