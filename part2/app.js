const express = require('express');
const path = require('path');
require('dotenv').config();
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Storing a login in a session
app.use(session({
    secret: "SuperSecretStringThatNoOneWillGuess",
    resave: false,
    saveUninitialized: false,

    // A https only cookie for logins that lasts an hour
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
        sameSite: 'lax'
    }
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);

// Export the app instead of listening here
module.exports = app;
