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

await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-05-19 09:00:00' , 60, 'Beachside Ave', 'completed');`);

await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-05-14 09:00:00' , 60, 'Beachside Ave', 'completed');`);

await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Zahli'), '2025-05-14 09:00:00' , 60, 'Fulham', 'completed');`);


await db.execute(`INSERT INTO WalkApplications (request_id, walker_id) VALUES (5, 2);`);
await db.execute(`INSERT INTO WalkApplications (request_id, walker_id) VALUES (6, 2);`);
await db.execute(`INSERT INTO WalkApplications (request_id, walker_id) VALUES (7, 2);`);

await db.execute(`INSERT INTO WalkApplications (request_id, walker_id) VALUES (8, 5);`);





await db.execute(`INSERT INTO WalkRatings (request_id, owner_id, walker_id, rating) VALUES (5, 3, 2, 4);`);
await db.execute(`INSERT INTO WalkRatings (request_id, owner_id, walker_id, rating) VALUES (6, 3, 2, 5);`);



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
SELECT WalkRequests.request_id, Dogs.name AS dog_name, WalkRequests.requested_time, WalkRequests.duration_minutes, WalkRequests.location, Users.username AS owner_username
FROM WalkRequests
INNER JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
INNER JOIN Users ON Dogs.owner_id = Users.user_id
WHERE WalkRequests.status = 'open';
        `);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open requests' });
  }
});

/* format

[
  {
    "walker_username": "bobwalker",
    "total_ratings": 2,
    "average_rating": 4.5,
    "completed_walks": 2
  },
  {
    "walker_username": "newwalker",
    "total_ratings": 0,
    "average_rating": null,
    "completed_walks": 0
  }
]
*/


app.get('/api/walkers/summary', async function(req, res, next) {
 try {
    const [requests] = await db.execute(`
SELECT Users.username AS walker_username,
COUNT(DISTINCT WalkRatings.rating_id) AS total_ratings,
AVG(CAST(WalkRatings.rating AS FLOAT)) AS average_rating,
COUNT(DISTINCT WalkApplications.application_id) AS completed_walks

FROM Users

LEFT JOIN WalkApplications ON Users.user_id = WalkApplications.walker_id
LEFT JOIN WalkRequests ON WalkApplications.request_id = WalkRequests.request_id AND WalkRequests.status = 'completed'
LEFT JOIN WalkRatings ON WalkRatings.walker_id = WalkApplications.walker_id


WHERE Users.role = 'walker'
GROUP BY Users.user_id;
        `);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch walkers summary' });
  }
});



app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
module.exports.db = db;
