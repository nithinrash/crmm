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

// Function to normalize keys
const normalizeKeys = (row) => {
  return {
    Date: row['Date'] || null,
    BDM_NAME: row['BDM NAME'] || null,
    COMPANY_NAME: row['COMPANY NAME'] || null,
    CUSTOMER_NAME: row['CUSTOMER NAME'] || null,
    DESIGNATION: row['DESIGNATION'] || null,
    PHONE_NO: row['PHONE NO'] || null,
    EMAIL_ADDRESS: row['EMAIL ADDRESS'] || null,
    COMMENTS: row['COMMENTS'] || null,
    Date_and_Time: row['Date and Time'] || null,
    BDM_REMARKS_AFTER_MEET: row['BDM REMARKS AFTER MEET'] || null,
    Follow_Up: row['Follow Up'] || null,
    Feedback: row['Feedback'] || null,
    Quotation_Value: row['Quotation Value'] || null,
    Received_Lost: row['Received / Lost'] || null,
    SourceComment: row['SourceComment'] || null,
    AssignedTo: row['Assignto'] || null,
    Status: row['Status'] || null
  };
};

router.post('/upload/leads', async (req, res) => {
  const { data } = req.body;

  try {
    // Log received data for debugging
    console.log('Received Excel Data:', data);

    // Establish a connection to the database
    const connection = await mysql.createConnection(dbConfig);

    // Define all columns in the `leads` table
    const columns = [
      "Date", "BDM_NAME", "COMPANY_NAME", "CUSTOMER_NAME", "DESIGNATION",
      "PHONE_NO", "EMAIL_ADDRESS", "COMMENTS", "Date_and_Time",
      "BDM_REMARKS_AFTER_MEET", "Follow_Up", "Feedback", "Quotation_Value",
      "Received_Lost", "SourceComment", "AssignedTo", "Status"
    ];

    // Prepare SQL query for insertion
    const query = `
      INSERT INTO leads (${columns.join(", ")})
      VALUES (${columns.map(() => "?").join(", ")})
    `;

    // Array to store inserted leads IDs
    const insertedLeads = [];

    // Insert each normalized row into the database
    for (const rawRow of data) {
      const normalizedRow = normalizeKeys(rawRow); // Normalize keys
      const values = columns.map(column => normalizedRow[column] || null); // Map normalized values

      // Execute the query and get the result
      const [result] = await connection.execute(query, values);

      // Push the auto-generated leads_id to the array
      insertedLeads.push({
        leads_id: result.insertId, // MySQL returns the last inserted ID here
        ...normalizedRow           // Include the rest of the data for reference
      });
    }

    // Close the database connection
    await connection.end();

    // Return inserted leads IDs and their corresponding data
    res.json({
      message: 'Excel data inserted into database successfully!',
      insertedLeads
    });
  } catch (error) {
    console.error('Error inserting data into database:', error);
    res.status(500).json({ message: 'Failed to insert data into database', error });
  }
});

module.exports = router;