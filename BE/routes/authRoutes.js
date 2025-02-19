const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

const dbConfig = {
  host: "localhost",
  port: 55968,
  user: "winger",
  password: "Winger@20082024",
  database: "crmm"
};

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?', 
      [username, password]
    );

    await connection.end();

    if (rows.length > 0) {
      const user = rows[0];
      res.json({
        status: 'success',
        user: {
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          role: user.role
        }
      });
    } else {
      res.json({
        status: 'failure',
        message: 'Invalid username or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router;