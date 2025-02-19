import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './DataTableLeadsSuma.css';

const DataTableLeadsShiva = () => {
  const [leadsData, setLeadsData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(''); // State to store the filter text
  const [startDate, setStartDate] = useState(''); // Start Date
  const [endDate, setEndDate] = useState('');     // End Date
  
  // Retrieve user data from localStorage
  const user = JSON.parse(localStorage.getItem('user')); // Assuming user data is stored in localStorage

useEffect(() => {
  const fetchLeadsData = async () => {
    try {
      const response = await api.get('/api/leads'); // Replace with your API endpoint

      // Filter and format data
      const filteredLeads = response.data.filter((lead) => lead.AssignedTo === user?.username);
      const formattedLeads = filteredLeads.map((lead) => ({
        ...lead,
        Date: formatDate(lead.Date), // Format 'Date' field
        appointment_date: formatDate(lead.appointment_date), // Format 'appointment_date' field
        time: lead.time ? convertToMySQLDatetime(lead.time) : null, // Convert 'time' field
      }));

      setLeadsData(formattedLeads);
      setDisplayedData(formattedLeads); // Initial load
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  fetchLeadsData();
}, []);



  // Helper function to format ISO datetime strings to 'YYYY-MM-DD'
// Helper function to format ISO datetime strings to 'YYYY-MM-DD' accounting for time zone
const formatDate = (isoDate) => {
  if (!isoDate) return ''; // Handle null or undefined values
  const date = new Date(isoDate);
  const timeZoneOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISODate = new Date(date.getTime() - timeZoneOffset); // adjust to local time zone
  return localISODate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }); // Returns date in the format 'DD Month YYYY' (e.g., '31 December 2021') long
};





  // Helper function to convert ISO 8601 datetime string to MySQL-compatible format
  const convertToMySQLDatetime = (isoString) => {
    if (!isoString) return null; // Handle null or undefined values
    const date = new Date(isoString); // Parse ISO string into a Date object
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`; // Format as 'YYYY-MM-DD HH:mm:ss'
  };


// Helper function to convert 'DD Month YYYY' to 'YYYY-MM-DD'
const convertToMySQLDate = (dateString) => {
  if (!dateString) return null; // Handle null or undefined values

  // Split the date string into day, month, and year components
  const [day, monthName, year] = dateString.split(' ');

  // Convert month name to month number (e.g., "January" -> "01")
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthIndex = months.indexOf(monthName);

  if (monthIndex === -1) {
    console.error('Invalid month name:', monthName);
    return null; // Invalid month name
  }

  // Format the date as 'YYYY-MM-DD'
  const month = String(monthIndex + 1).padStart(2, '0'); // Add leading zero if needed
  const dayFormatted = String(day).padStart(2, '0'); // Add leading zero if needed

  return `${year}-${month}-${dayFormatted}`;
};

  
  
  const handleCellChange = (rowIndex, columnName, newValue) => {
    setDisplayedData((prevData) => {
      const updatedData = [...prevData];
      updatedData[rowIndex] = { ...updatedData[rowIndex], [columnName]: newValue }; // Update only the specific cell value
      
      return updatedData;
    });
  };



  const filterLeads = () => {
    return leadsData.filter((lead) => {
      return Object.values(lead).some((value) =>
        value.toString().toLowerCase().includes(filter.toLowerCase())
      );
    });
  };


  
  const formatIndianCurrency = (value) => {
    if (!value || isNaN(value)) return value; // Return original value if invalid
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  const handleSaveChanges = async (rowIndex) => {
    try {
      const updatedRow = displayedData[rowIndex]; // Get updated row data
  
      if (!updatedRow.leads_id) { 
        console.error('Error: leads_id is undefined for row:', updatedRow);
        alert('Error: leads_id is missing. Cannot save changes.');
        return;
      }
  
      if (!user || !user.user_id) { 
        console.error('Error: User not logged in or user_id is missing.');
        alert('Error: User not logged in. Please log in again.');
        return;
      }
  
      // Convert 'time' field to MySQL-compatible format before saving
      if (updatedRow.time) {
        updatedRow.time = convertToMySQLDatetime(updatedRow.time); // Convert time to MySQL format
      }
  
      // Convert 'Date' and 'appointment_date' fields to MySQL-compatible format
      if (updatedRow.Date) {
        updatedRow.Date = convertToMySQLDate(updatedRow.Date); // Convert to MySQL format
      }
  
      if (updatedRow.appointment_date) {
        updatedRow.appointment_date = convertToMySQLDate(updatedRow.appointment_date); // Convert to MySQL format
      }
  


      const appointmentDetails = {
        appointment_date: updatedRow.appointment_date || "N/A",
        appointment_time: updatedRow.appointment_time || "N/A",
        company_name: "N/A", // Assuming this is a placeholder
        connect_person: "N/A", // Assuming connect_person is a placeholder
      };
  
      console.log("Appointment Details:", appointmentDetails); // Log it to the console
  
      // Save appointmentDetails as JSON in the 'reminder' column
      updatedRow.reminder = JSON.stringify(appointmentDetails);
      console.log("Final Updated Row Data Sent to Backend:", updatedRow);
  
      // Send PUT request to update backend with user information
      const response = await api.put('/api/leads/update', { 
        leads_id: updatedRow.leads_id,
        updatedData: updatedRow,
        user_id: user.user_id, // Pass logged-in user's ID to backend
      });
  
      alert(response.data.message || 'Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes.');
    }
  };
  
  
  
  const getRowStyle = (hwcValue) => {
    switch (hwcValue) {
      case 'HOT':
        return { backgroundColor: 'rgba(255, 0, 0, 0.2)' }; // Light red transparent
      case 'Worm':
        return { backgroundColor: 'rgba(255, 255, 0, 0.2)' }; // Light yellow transparent
      case 'Cold':
        return { backgroundColor: 'rgba(0, 0, 255, 0.2)' }; // Light blue transparent
      default:
        return {};
    }
  };


  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (



    <div className="data-table-container">
      {/* Display Logged-In User Details */}
      {/* <div className="user-info">
        <h2>Welcome, {user?.name || "User"}!</h2>
        <p>User ID: {user?.username}</p>
        <p>Email: {user?.email}</p>
      </div> */}
      {/* Display Logged-In User Details */}




      <div className="table-wrapper">
        <table className="leads-table">
          <thead>
            <tr>
              {leadsData.length > 0 &&
                Object.keys(leadsData[0]).map((header) => (
                  <th key={header} className="sticky-header">
                    {header.replace(/_/g, ' ').toUpperCase()}
                  </th>
                ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((lead, rowIndex) => (
              <tr key={rowIndex} style={getRowStyle(lead.HWC)}>
                {Object.entries(lead).map(([key, value], cellIndex) => (
                  <td key={cellIndex}>
                    {formatEditableCell(value, key, rowIndex, handleCellChange)}
                  </td>
                ))}
                <td>
                  {/* Save Button */}
                  <button onClick={() => handleSaveChanges(rowIndex)}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper function to format editable cells
const formatEditableCell = (value, columnName, rowIndex, handleCellChange) => {


  if (columnName === 'Date') {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
        style={{
          display: 'none', // Make the column invisible
          width: '100px', // Keep it in the DOM but make it invisible
          padding: '5px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      />
    );
  }




if (columnName === 'time' ) {
  return (
      <input
          type="text"
          value={value || ''}
          onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
          style={{
            display: 'none',
              width: '150px', // Wider width for date columns
              padding: '5px',
              border: '1px solid #ddd',
              borderRadius: '4px'
          }}
      />
  );
}


if (columnName === 'customer_appoinemnt' ) {
  return (
      <input
          type="text"
          value={value || ''}
          onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
          style={{
            display: 'none',
              width: '150px', // Wider width for date columns
              padding: '5px',
              border: '1px solid #ddd',
              borderRadius: '4px'
          }}
      />
  );
}

if (columnName === 'preQuotation_Value') {
  const formatIndianCurrency = (value) => {
    if (!value || isNaN(value)) return value; // Return original value if invalid
    return Number(value).toLocaleString('en-IN'); // Format number with Indian commas
  };

  return (
    <input
      type="text"
      value={formatIndianCurrency(value) || ''} // Format value as Indian currency
      onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value.replace(/,/g, ''))} // Remove commas before updating state
      style={{
        width: '150px', // Wider width for better readability
        padding: '5px',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}
    />
  );
}


if (columnName === 'Quotation_Value') {
  const formatIndianCurrency = (value) => {
    if (!value || isNaN(value)) return value; // Return original value if invalid
    return Number(value).toLocaleString('en-IN'); // Format number with Indian commas
  };

  return (
    <input
      type="text"
      value={formatIndianCurrency(value) || ''} // Format value as Indian currency
      onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value.replace(/,/g, ''))} // Remove commas before updating state
      style={{
        width: '150px', // Wider width for better readability
        padding: '5px',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}
    />
  );
}


  if (columnName === 'Authontic') {
    return (
      <select 
        value={value || 'authontic'} 
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
      >
        <option value="authontic">Authontic</option>
        <option value="non authontic">Non Authontic</option>
      </select>
    );
  }



  if (columnName === 'CloseDate') {
    return (
      <input
        type="date" // Calendar input for selecting a date
        value={value || ''} // Bind the value to the state
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)} // Update state on change
        style={{
          width: '150px', // Adjust width for better readability
          padding: '5px',
          border: '1px solid #ddd',
          borderRadius: '4px',
        }}
      />
    );
  }




  if (columnName === 'customer_appoinemnt') {
    return (
      <>
        <select 
          value={value || 'requires'} 
          onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
          style={{ marginBottom: '5px' }}
        >
          <option value="appointment">Appointment</option>
          <option value="requires">Requires</option>
        </select>

        {/* Show calendar and time picker when "appointment" is selected */}
        {value === 'appointment' && (
          <>
            {/* Calendar Input */}
            <input 
              type="date" 
              onChange={(e) => handleCellChange(rowIndex, 'appointment_date', e.target.value)} 
              style={{ display: 'block', marginBottom: '5px' }}
            />
            
            {/* Time Picker Input */}
            <input 
              type="time" 
              onChange={(e) => handleCellChange(rowIndex, 'appointment_time', e.target.value)} 
              style={{ display: 'block' }}
            />
          </>
        )}
      </>
    );
  }

  if (columnName === 'after_sales') {
    return (
      <select 
        value={value || ''} 
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
      >
        <option value="">Select Option</option>
        <option value="Quotation Sent">Quotation Sent</option>
        <option value="Negotiation">Negotiation</option>
        <option value="Converted to Business">Converted to Business</option>
        <option value="Won">Won</option>
        <option value="Lost">Lost</option>
        <option value="Postponed">Postponed</option>
      </select>
    );
  }


  if (columnName === 'HWC') {
    return (
      <select 
        value={value || ''} 
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
      >
        <option value="">Select Option</option>
        <option value="HOT">HOT</option>
        <option value="Worm">Worm</option>
        <option value="Cold">Cold</option>

      </select>
    );
  }

  if (columnName === 'AssignedTo') { // Add dropdown for AssignedTo
    return (
      <select 
        value={value || ''} 
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
      >
        <option value="">Select AssignedTo</option>
        <option value="Suma">Suma</option>
        <option value="Muskan">Muskan</option>
        <option value="Shiva">Shiva</option>
        <option value="Pushpendra">Pushpendra</option>
        <option value="Mustafa">Mustafa</option>
      </select>
    );
  }

  return (
    <textarea
    value={value || ''}
    onChange={(e) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
        handleCellChange(rowIndex, columnName, e.target.value);
    }}
    onFocus={(e) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }}
    style={{
        width: '100%',
        minHeight: '30px',
        maxHeight: '150px',
        padding: '5px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: '1.5',
        boxSizing: 'border-box'
    }}
/>
  );
};

export default DataTableLeadsShiva;
