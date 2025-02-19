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

// Route to handle pushing data
router.post('/push', async (req, res) => {
  const { data } = req.body; // Extract data from request body

  try {
    // Establish a connection to the database
    const connection = await mysql.createConnection(dbConfig);

    // Insert each row into the database
    for (const row of data) {
      const query = `
        INSERT INTO audit (lead_id, AssignedTo, Status, LeadComment)
        VALUES (?, ?, ?, ?)
      `;
      const values = [row.lead_id, row.AssignedTo, row.Status, row.LeadComment];
      await connection.execute(query, values);
    }

    // Close the database connection
    await connection.end();

    res.json({ message: 'Data pushed successfully!' });
  } catch (error) {
    console.error('Error pushing data:', error);
    res.status(500).json({ message: 'Failed to push data', error });
  }
});

module.exports = router;