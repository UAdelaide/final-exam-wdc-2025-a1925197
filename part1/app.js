var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');


var app = express();


let db;

// adapting from app.js

(async () => {
  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '' // Set your MySQL root password
    });

    // Replace the database
    await connection.execute(`DROP DATABASE IF EXISTS DogWalkService;`);
    await connection.execute(`CREATE DATABASE DogWalkService;`);

    // Now connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // From dogwalks.sql, creating the data
    await db.execute(`
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'walker') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);

await db.execute(`
    CREATE TABLE Dogs (
    dog_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    size ENUM('small', 'medium', 'large') NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES Users(user_id)
);`);

await db.execute(`
CREATE TABLE WalkRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    dog_id INT NOT NULL,
    requested_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
);`);

await db.execute(`
CREATE TABLE WalkApplications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    walker_id INT NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
    FOREIGN KEY (walker_id) REFERENCES Users(user_id),
    CONSTRAINT unique_application UNIQUE (request_id, walker_id)
);`);

await db.execute(`
CREATE TABLE WalkRatings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    walker_id INT NOT NULL,
    owner_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
    FOREIGN KEY (walker_id) REFERENCES Users(user_id),
    FOREIGN KEY (owner_id) REFERENCES Users(user_id),
    CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
);`);



await db.execute(`INSERT INTO Users (username, email, password_hash, role) VALUES ('alice123', 'alice@example.com', 'hashed123', 'owner');`);

await db.execute(`INSERT INTO Users (username, email, password_hash, role) VALUES ('bobwalker', 'bob@example.com', 'hashed456', 'walker');`);

await db.execute(`INSERT INTO Users (username, email, password_hash, role) VALUES ('carol123', 'carol@example.com', 'hashed789', 'owner');`);

await db.execute(`INSERT INTO Users (username, email, password_hash, role) VALUES ('lachm', 'lachm@example.com', 'hashed318', 'owner');`);

await db.execute(`INSERT INTO Users (username, email, password_hash, role) VALUES ('tina', 'tk@example.com', 'hashed142', 'walker');`);




await db.execute(`INSERT INTO Dogs (owner_id, name, size) VALUES ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium');`);

await db.execute(`INSERT INTO Dogs (owner_id, name, size) VALUES ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small');`);

await db.execute(`INSERT INTO Dogs (owner_id, name, size) VALUES ((SELECT user_id FROM Users WHERE username = 'lachm'), 'Zahli', 'medium');`);

await db.execute(`INSERT INTO Dogs (owner_id, name, size) VALUES ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Izzie', 'small');`);

await db.execute(`INSERT INTO Dogs (owner_id, name, size) VALUES ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Giancarlo', 'small');`);

await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location) VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00' , 30, 'Parklands');`);

await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00' , 45, 'Beachside Ave', 'accepted');`);

await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location) VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Giancarlo'), '2025-06-11 09:00:00' , 30, 'Fulham');`);

await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Zahli'), '2025-06-20 11:00:00' , 30, 'Grange', 'accepted');`);

await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-05-20 09:00:00' , 60, 'Beachside Ave', 'completed');`);

  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




app.get('/api/dogs', async function(req, res, next) {
   try {
    const [dogs] = await db.execute(`
SELECT Dogs.name, Dogs.size, Users.username FROM Dogs INNER JOIN Users ON Dogs.owner_id = Users.user_id;
        `);
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.get('/api/walkrequests/open', async function(req, res, next) {
     try {
    const [requests] = await db.execute(`
SELECT WalkApplications.request_id, Dogs.name, Dogs.size, Users.username
FROM WalkApplications
INNER JOIN Dogs ON WalkApplications.owner_id = Users.user_id;
INNER JOIN Users ON Dogs.owner_id = Users.user_id;
        `);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open requests' });
  }
});

app.get('/api/walkers/summary', function(req, res, next) {
  res.send('respond with a resource');
});



app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
module.exports.db = db;
