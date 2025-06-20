const express = require('express');
const router = express.Router();

const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// middleware for authenticating the user cookie session thing
function authenticate(req, res, next) {
  if(req.session.user)
  {
    next();
  }
  else
  {
    res.status(401);
  }
}

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if(!username.trim() || !password.trim())
  {
    return res.status(401).json({ error: 'Username and password requred' });
  }

  const usernameTrimmed = username.trim();
  const passwordTrimmed = password.trim();

  try {
    const [rows] = await db.query(`
      SELECT user_id, role FROM Users
      WHERE username = ? AND password_hash = ?;
    `, [usernameTrimmed, passwordTrimmed]);

    console.log("trying login with " + usernameTrimmed + " and pass " + passwordTrimmed);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    req.session.user = {
      id: user.id,
      username: usernameTrimmed,
      role: user.role
    };

    res.json({ message: 'Login successful', user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get("logout", async (req, res))

module.exports = router;
module.exports.authenticate = authenticate;
