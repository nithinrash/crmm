import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DataTableLeadsSource = () => {
  const [leadsData, setLeadsData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupReminderData, setPopupReminderData] = useState(null);

 
  const handleTableScroll = useCallback((containerRefElement) => {
    if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        
        // Load more data when user scrolls near bottom
        if (scrollHeight - scrollTop - clientHeight < 400 && !loading) {
            // Fetch next batch of data
            const nextBatch = async () => {
                try {
                    const response = await api.get('/api/leads', {
                        params: {
                            offset: displayedData.length,
                            limit: 50
                        }
                    });
                    
                    const newLeads = response.data
                        .filter(lead => lead.AssignedTo === user?.username 
                            && lead.Authontic !== 'non authontic')
                        .map(lead => ({
                            ...lead,
                            Date: formatDate(lead.Date),
                            appointment_date: formatDate(lead.appointment_date),
                            time: lead.time ? convertToMySQLDatetime(lead.time) : null,
                        }));

                    setDisplayedData(prev => [...prev, ...newLeads]);
                } catch (err) {
                    console.error('Error loading more data:', err);
                }
            };
            nextBatch();
        }
    }
}, [displayedData.length, loading]);

  // Retrieve user data from localStorage
  const user = JSON.parse(localStorage.getItem('user')); // Assuming user data is stored in localStorage
  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };
  
  // Helper function to format ISO datetime strings to 'YYYY-MM-DD'
  const formatDate = (isoDate) => {
    if (!isoDate) return ''; // Handle null or undefined values
    const date = new Date(isoDate); // Parse the ISO string into a Date object
    return date.toISOString().split('T')[0]; // Extract and return the 'YYYY-MM-DD' part
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

  useEffect(() => {
    const fetchLeadsData = async () => {
      try {
        const response = await api.get('/api/leads'); // Replace with your API endpoint

        // Dynamically filter rows where AssignedTo matches the logged-in user's username
        const filteredLeads = response.data.filter((lead) => lead.AssignedTo === user?.username && lead.Authontic !== 'non authontic');

        // Format dates and time in the filtered leads
        const formattedLeads = filteredLeads.map((lead) => ({
          ...lead,
          Date: formatDate(lead.Date), // Format 'Date' field
          appointment_date: formatDate(lead.appointment_date), // Format 'appointment_date' field
          time: lead.time ? convertToMySQLDatetime(lead.time) : null, // Format 'time' field

        }));

        setLeadsData(formattedLeads.slice(0, 50));
        setDisplayedData(formattedLeads.slice(0, 50)); // Initial load
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLeadsData();
  }, []);

  const handleCellChange = (rowIndex, columnName, newValue) => {
    setDisplayedData((prevData) => {
      const updatedData = [...prevData];
      updatedData[rowIndex] = { ...updatedData[rowIndex], [columnName]: newValue }; // Update only the specific cell value
      return updatedData;
     
    });
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
  
      // Create appointmentDetails object
      const appointmentDetails = {
        appointment_date: updatedRow.appointment_date || "N/A",
        appointment_time: updatedRow.appointment_time || "N/A",
        company_name: updatedRow.COMPANY_NAME || "N/A",
        connect_person: user?.username || "N/A", // Add connect_person from user
      };
  
      console.log("Appointment Details:", appointmentDetails); // Log it to the console
  
      // Save appointmentDetails as JSON in the 'reminder' column
      updatedRow.reminder = JSON.stringify(appointmentDetails);
  
      // Convert 'time' field to MySQL-compatible format before saving
      if (updatedRow.time) {
        updatedRow.time = convertToMySQLDatetime(updatedRow.time);
      }
  
      // Format other date fields before sending to backend
      if (updatedRow.Date) {
        updatedRow.Date = formatDate(updatedRow.Date);
      }
      if (updatedRow.appointment_date) {
        updatedRow.appointment_date = formatDate(updatedRow.appointment_date);
      }
  
      // Log final data sent to backend
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
  
  const fetchAllReminders = async () => {
    try {
      const response = await api.get('/api/leads'); // Fetch data from backend
      const reminders = response.data
        .map((row) => row.reminder) // Extract only the reminder column
        .filter((reminder) => {
          try {
            const parsedReminder = JSON.parse(reminder); // Parse JSON if stored as a string
            return parsedReminder.connect_person === user?.username; // Filter rows where connect_person is "Suma"
          } catch (error) {
            console.error("Error parsing reminder:", error);
            return false; // Skip invalid reminders
          }
        });
      setPopupReminderData(reminders); // Set filtered reminders in state
      setIsPopupVisible(true); // Show popup
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };
  

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="data-table-container">
      {/* Display Logged-In User Details */}



  <button onClick={fetchAllReminders}>Fetch All Reminders</button>


  {isPopupVisible && (
  <div className="popup">
    <div className="popup-content">
      <h3>All Reminders</h3>
      <ul>
        {popupReminderData.map((reminder, index) => (
          <li key={index}>{reminder || 'No Reminder'}</li> // Display each reminder
        ))}
      </ul>
      <button onClick={() => setIsPopupVisible(false)}>Close</button>
    </div>
  </div>
)}



<div 
    className="-wrapper" 
    onScroll={(e) => handleTableScroll(e.target)}
    style={{
        overflowY: 'auto', // Ensures scrolling within the wrapper
        maxHeight: '400px', // Set max height if needed, adjust as per your requirement
    }}
>
    <table className="leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
            <tr>
                {displayedColumns.map(header => (
                    <th 
                        key={header} 
                        className="sticky-header" 
                        style={{
                            position: 'sticky',
                            top: '0',
                            backgroundColor: '#fff', // Keeps the background white when sticky
                            zIndex: 10, // Ensures the header stays on top of other content
                            padding: '10px',
                            borderBottom: '2px solid #ddd',
                        }}
                    >
                        {header.toUpperCase()}
                    </th>
                ))}
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {displayedData.map((lead, rowIndex) => (
                <tr 
                    key={rowIndex}
                    style={{
                        backgroundColor: lead.AssignedTo === 'Mustafa' ? 'rgba(0, 0, 255, 0.2)' : ''
                    }}
                >
                    {displayedColumns.map(column => (
                        <td key={column} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                            {formatEditableCell(
                                lead[column],
                                column,
                                rowIndex,
                                handleCellChange
                            )}
                        </td>
                    ))}
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button 
                            onClick={() => handleSaveChanges(rowIndex)}
                            style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Save
                        </button>
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
  if (columnName === 'Authontic') {
    return (
      <select 
        value={value || 'Authontic'} 
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
      ><option value="Select">Select</option>
        <option value="authontic">Authontic</option>
        <option value="non authontic">Non Authontic</option>
      </select>
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

  if (columnName === 'AssignedTo') {
    return (
      <select 
        value={value || ''} 
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
      >
        <option value="">Select AssignedTo</option>
        <option value="Shiva">Shiva</option>
        <option value="Pushpendra">Pushpendra</option>
        <option value="Muskan">Muskan</option>
        <option value="Suma">Suma</option>
      </select>
    );
  }

  if (columnName === 'Status') {
    return (
      <select 
        value={value || ''} 
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
      >
        <option value="">Select Status</option>
        <option value="Leads">Leads</option>
        <option value="Sales">Sales</option>
      </select>
    );
  }

  return (
    <input
      type="text"
      value={value || ''} // Bind input value to state
      onChange={(e) =>
        handleCellChange(rowIndex, columnName, e.target.value)
      } // Update state on change
      style={{
        width: '100%',
        padding: '5px',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}
    />
  );
};

export default DataTableLeadsSource;
