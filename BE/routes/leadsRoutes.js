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




// Leads Fetching Route
router.get('/', async (req, res) => {
  try {
    // Establish a connection to the database
    const connection = await mysql.createConnection(dbConfig);

    // Execute a query to fetch all leads
    const [rows] = await connection.execute('SELECT * FROM leads');

    // Close the database connection
    await connection.end();

    // Send the fetched data as a JSON response
    res.json(rows);
  } catch (error) {
    console.error('Leads fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching leads'
    });
  }
});

// Update a lead in the leads table
router.put('/update', async (req, res) => {
  const { leads_id, updatedData, user_id } = req.body;

  try {
    if (!leads_id) {
      console.error('Error: leads_id is undefined');
      return res.status(400).json({ message: 'leads_id is required' });
    }

    if (!user_id) {
      console.error('Error: user_id is undefined');
      return res.status(400).json({ message: 'user_id is required' });
    }

    // Replace undefined or null values with defaults
    const sanitizedData = Object.fromEntries(
      Object.entries(updatedData).map(([key, value]) => [
        key,
        value === undefined || value === null ? '' : value // Replace NULL/undefined with empty string
      ])
    );

    console.log('Sanitized Data:', sanitizedData);

    // Establish a connection to the database
    const connection = await mysql.createConnection(dbConfig);

    // Prepare SQL query for updating data in leads
    const columns = Object.keys(sanitizedData)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(sanitizedData);

    const updateSql = `UPDATE leads SET ${columns} WHERE leads_id = ?`;
    values.push(leads_id); // Add leads_id to end of values array

    // Execute update query
    const [updateResult] = await connection.execute(updateSql, values);//28

    // Prepare SQL query for inserting data into audit
    const auditSql = `
      INSERT INTO audit (
        leads_id, user_id, Date, BDM_NAME, COMPANY_NAME, CUSTOMER_NAME,
        DESIGNATION, PHONE_NO, EMAIL_ADDRESS, COMMENTS, Date_and_Time,
        BDM_REMARKS_AFTER_MEET, Follow_Up, Feedback, preQuotation_Value,
        Quotation_Value, Received_Lost, Comment, Status, AssignedTo,
        appointment_date, appointment_time, customer_appoinemnt,
        Authontic, after_sales, reminder, selfreminder, HWC,CloseDate
      )
      VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?)
    `;
    
    const auditValues = [
      leads_id || null,
      user_id || null,
      sanitizedData.BDM_NAME || '',
      sanitizedData.COMPANY_NAME || '',
      sanitizedData.CUSTOMER_NAME || '',
      sanitizedData.DESIGNATION || '',
      sanitizedData.PHONE_NO || '',
      sanitizedData.EMAIL_ADDRESS || '',
      sanitizedData.COMMENTS || '',
      sanitizedData.Date_and_Time || '',
      sanitizedData.BDM_REMARKS_AFTER_MEET || 'No Remarks',
      sanitizedData.Follow_Up || '',
      sanitizedData.Feedback || '',
      sanitizedData.preQuotation_Value || '', // Pass preQuotation_Value here
      sanitizedData.Quotation_Value || '', // Pass Quotation_Value here
      sanitizedData.Received_Lost || '',
      sanitizedData.Comment || '',
      sanitizedData.Status || '',
      sanitizedData.AssignedTo || '',
      sanitizedData.appointment_date || null,
      sanitizedData.appointment_time || null,
      sanitizedData.customer_appoinemnt || '',
      sanitizedData.Authontic || '',
      sanitizedData.after_sales || '',
      sanitizedData.reminder !== undefined ? sanitizedData.reminder : '', 
      sanitizedData.selfreminder !== undefined ? sanitizedData.selfreminder : '', 
      sanitizedData.HWC !== undefined ? sanitizedData.HWC : '',
      sanitizedData.CloseDate || ''
    ];

    // Log audit values for debugging
    console.log('Audit Insert Values:', auditValues);

    // Execute insert query for audit
    const [auditResult] = await connection.execute(auditSql, auditValues);

    // Close database connection
    await connection.end();

    res.json({
      message: 'Lead updated successfully and audit log created!',
      affectedRows: updateResult.affectedRows,
      auditInsertedId: auditResult.insertId,
    });
  } catch (error) {
    console.error('Error updating lead and creating audit log:', error);
    res.status(500).json({ message: 'Failed to update lead and create audit log', error });
  }
});

module.exports = router;
