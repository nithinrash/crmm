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
    Comment: row['SourceComment'] || null,
    AssignedTo: row['Assignto'] || null,
    Status: row['Status'] || null,
    HWC: row['HWC'] || null
  };
};

// Upload to Audit
router.post('/upload/audit', async (req, res) => {
  const { data, user } = req.body;

  try {
    // Log received data for debugging
    console.log('Received Audit Data:', data);
    console.log('User Details:', user);

    // Establish a connection to the database
    const connection = await mysql.createConnection(dbConfig);

    // Define all columns in the `audit` table
    const columns = [
      "leads_id", "user_id", "Date", "BDM_NAME", "COMPANY_NAME", 
      "CUSTOMER_NAME", "DESIGNATION", "PHONE_NO", 
      "EMAIL_ADDRESS", "COMMENTS", "Date_and_Time",
      "BDM_REMARKS_AFTER_MEET", "Follow_Up", 
      "Feedback", "Quotation_Value", 
      "Received_Lost", "SourceComment","AssignedTo",
      "Status","HWC"
    ];

    // Prepare SQL query for insertion
    const query = `
      INSERT INTO audit (${columns.join(", ")})
      VALUES (${columns.map(() => "?").join(", ")})
    `;

    // Insert each row into the audit table
    for (const rawRow of data) {
      const normalizedRow = normalizeKeys(rawRow); // Normalize keys

      // Prepare values for insertion
      const values = [
        rawRow.leads_id || null, // Lead ID from frontend
        user.user_id || null,   // User ID from frontend
        ...Object.values(normalizedRow)
      ];

      console.log('Inserting Values:', values); // Debugging log

      await connection.execute(query, values);
    }

    // Close the database connection
    await connection.end();

    res.json({
      message: 'Data successfully uploaded to audit!'
    });
  } catch (error) {
    console.error('Error inserting data into audit:', error.message);
    
	res.status(500).json({ message:'Failed To Insert Data Into Audit',error:error.message});}});
module.exports=router;