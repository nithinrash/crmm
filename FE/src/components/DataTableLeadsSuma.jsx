import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './DataTableLeadsSuma.css';

const DataTableLeadsSuma = () => {
    const [leadsData, setLeadsData] = useState([]);
    const [displayedData, setDisplayedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAllRemindersPopupVisible, setIsAllRemindersPopupVisible] = useState(false);
    const [isSelfRemindersPopupVisible, setIsSelfRemindersPopupVisible] = useState(false);
    const [popupReminderData, setPopupReminderData] = useState(null);
    const [allData, setAllData] = useState([]); // Store complete data
    
    const user = JSON.parse(localStorage.getItem('user'));

    // const formatDate = (isoDate) => {
    //     if (!isoDate) return '';
    //     const date = new Date(isoDate);
    //     return date.toISOString().split('T')[0];
    // };

    // const formatDate = (isoDate) => {
    //     if (!isoDate) return ''; // Handle null or undefined values
    //     const date = new Date(isoDate);
    //     const timeZoneOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    //     const localISODate = new Date(date.getTime() - timeZoneOffset); // adjust to local time zone
    //     return localISODate.toLocaleDateString('en-GB', {
    //       day: '2-digit',
    //       month: 'long',
    //       year: 'numeric'
    //     }); // Returns date in the format 'DD Month YYYY' (e.g., '31 December 2021') long
    //   };
      


    const formatDate = (isoDate) => {
        if (!isoDate) return '';
        
        const date = new Date(isoDate);
        
        // Normalize the date to the UTC midnight (00:00:00) to avoid timezone issues
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); 
        
        // Return the date in YYYY-MM-DD format
        return date.toISOString().split('T')[0];
    };

    
      const formatDateForSQL = (isoDate) => {
        if (!isoDate) return ''; // Handle null or undefined values
        const date = new Date(isoDate);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) return ''; // Invalid date
        
        // Get the year, month, and day in the format YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
        const day = String(date.getDate()).padStart(2, '0'); // Ensure day is two digits
        
        return `${year}-${month}-${day}`; // Returns date in the format 'YYYY-MM-DD' (e.g., '2024-10-29')
      };

      


    const fetchAllReminders = async () => {
      try {
          const response = await api.get('/api/leads');
          const reminders = response.data
              .map((row) => row.reminder)
              .filter((reminder) => {
                  try {
                      const parsedReminder = JSON.parse(reminder);
                      return (
                          parsedReminder.connect_person === user?.username &&
                          parsedReminder.appointment_time !== "11:11:11" &&
                          parsedReminder.appointment_date !== "1111-11-11" 
                
                      );
                  } catch (error) {
                      return false;
                  }
              });
          setPopupReminderData(reminders);
          setIsAllRemindersPopupVisible(true);
      } catch (error) {
          console.error('Error fetching reminders:', error);
      }
  };
  
  const fetchAllSelfReminders = async () => {
      try {
          const response = await api.get('/api/leads');
          const selfReminders = response.data.filter((row) => {
              if (!row.selfreminder) return false;
              const [username] = row.selfreminder.split(':').map((str) => str.trim());
              return username === user?.username;
          });
          setPopupReminderData(selfReminders);
          setIsSelfRemindersPopupVisible(true);
      } catch (error) {
          console.error('Error fetching selfreminders:', error);
      }
  };

  const handleClearSelfReminder = async (leadsId, index) => {
    try {
        if (!leadsId) {
            alert('Error: Lead ID is missing. Cannot clear selfreminder.');
            return;
        }
        if (!user?.user_id) {
            alert('Error: User not logged in. Please log in again.');
            return;
        }

        // Create appointment details with cleared reminder
        const appointmentDetails = {
            appointment_date: "N/A",
            appointment_time: "N/A",
            company_name: "N/A",
            connect_person: user?.username || "N/A",
            lead_id: leadsId
        };

        // Send update request with cleared reminder
        const response = await api.put('/api/leads/update', {
            leads_id: leadsId,
            updatedData: {
                selfreminder: '',
                reminder: JSON.stringify(appointmentDetails)
            },
            user_id: user.user_id,
            user_info: {
                username: user?.username,
                email: user?.email,
                role: user?.role,
                department: user?.department,
                user_id: user?.user_id
            }
        });

        // Update UI state
        setPopupReminderData(prevData => {
            const updatedData = [...prevData];
            updatedData[index].selfreminder = '';
            updatedData[index].reminder = JSON.stringify(appointmentDetails);
            return updatedData;
        });

        alert('Self reminder cleared successfully!');
    } catch (error) {
        console.error('Error clearing self reminder:', error);
        alert('Failed to clear self reminder.');
    }
};

  

    const displayedColumns = [
        'Date', 'Company Name', 'Customer Name', 'Designation', 
        'Phone no', 'Email Address', 'Comments', 'Source Comment', 
        'Lead Comment', 'Custom Appointment', 'Appointment Date', 
        'Appointment Time', 'Self Reminder', 'Authontic', 'Status', 'AssignedTo','Leads'
    ];

    const columnMapping = {
        Date: 'Date',
        COMPANY_NAME: 'Company Name',
        CUSTOMER_NAME: 'Customer Name',
        DESIGNATION: 'Designation',
        PHONE_NO: 'Phone no',
        EMAIL_ADDRESS: 'Email Address',
        COMMENTS: 'Comments',
        SourceComment: 'Source Comment',
        LeadComment: 'Lead Comment',
        customer_appoinemnt: 'Custom Appointment',
        appointment_date: 'Appointment Date',
        appointment_time: 'Appointment Time',
        selfreminder: 'Self Reminder',
        Authontic: 'Authontic',
        Status: 'Status',
        AssignedTo: 'AssignedTo',
        leads_id: "Leads"
    };


   


    const convertToMySQLDatetime = (isoString) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };

    const filterDisplayedData = (data) => {
        return data.map(item => {
            const filteredItem = {};
            displayedColumns.forEach(column => {
                const dbColumn = Object.entries(columnMapping)
                    .find(([_, value]) => value === column)?.[0];
                filteredItem[column] = item[dbColumn] || '';
            });
            return filteredItem;
        });
    };

    useEffect(() => {
      const fetchLeadsData = async () => {
          try {
              const response = await api.get('/api/leads');
              const filteredLeads = response.data.filter(
                  lead => lead.AssignedTo === user?.username && 
                  lead.Authontic !== 'non authontic'
              );
  
              const formattedLeads = filteredLeads.map(lead => ({
                  ...lead,
                  Date: formatDate(lead.Date),
                  appointment_date: formatDate(lead.appointment_date),
                  time: lead.time ? convertToMySQLDatetime(lead.time) : null,
              }));
  
              // Store both complete and displayed data
              setLeadsData(formattedLeads);
              const displayData = filterDisplayedData(formattedLeads);
              setDisplayedData(displayData);
              setLoading(false);
          } catch (err) {
              setError(err.message);
              setLoading(false);
          }
      };
      fetchLeadsData();
  }, []);
  
  

    const handleCellChange = (rowIndex, columnName, newValue) => {
        setDisplayedData(prevData => {
            const updatedData = [...prevData];
            updatedData[rowIndex] = {
                ...updatedData[rowIndex],
                [columnName]: newValue
            };
            return updatedData;
        });
    };




    const getCurrentDateTime = () => {
        const options = {
            weekday: 'long',   // "Monday"
            year: 'numeric',   // "2025"
            month: 'long',     // "January"
            day: 'numeric',    // "1"
            hour: 'numeric',   // "1"
            minute: 'numeric', // "45"
            hour12: true,      // "PM" or "AM"
        };
    
        const bangaloreTime = new Date().toLocaleString("en-IN", options); // Use the "en-IN" locale for Indian date-time format
    
        console.log("Formatted Bangalore Time: ", bangaloreTime); // Log the formatted time to the console
        return bangaloreTime;
    };
    


     

    const handleSaveChanges = async (rowIndex) => {
        try {
            const displayRow = displayedData[rowIndex];
            const completeRow = leadsData[rowIndex];
    
            // Get lead ID from the complete data
            const leadId = completeRow?.leads_id;
    
            console.log('Complete Row:', completeRow); // Debug log
    
            if (!leadId) {
                alert('Error: Lead ID is missing for this row. Cannot save changes.');
                return;
            }
            if (!user?.user_id) {
                alert('Error: User not logged in. Please log in again.');
                return;
            }
    
            // Map display names to database column names
            const dbColumnMapping = {
                'Company Name': 'COMPANY_NAME',
                'Customer Name': 'CUSTOMER_NAME',
                'Designation': 'DESIGNATION',
                'Phone no': 'PHONE_NO',
                'Email Address': 'EMAIL_ADDRESS',
                'Comments': 'COMMENTS',
                'Source Comment': 'SourceComment',
                'Lead Comment': 'LeadComment',
                'Custom Appointment': 'customer_appoinemnt',
                'Appointment Date': 'appointment_date',
                'Appointment Time': 'appointment_time',
                'Self Reminder': 'selfreminder',
                'Leads': 'leads_id'
            };
    
            // Get the current Bangalore time
            const currentDateTime = getCurrentDateTime();
    
            // Create database-friendly update object
            const dbUpdateData = {};
            Object.entries(displayRow).forEach(([key, value]) => {
                const dbKey = dbColumnMapping[key] || key;
                if (value !== null && value !== undefined && value !== '') {
                    dbUpdateData[dbKey] = value;
                } else {
                    dbUpdateData[dbKey] = completeRow[dbKey] || '';
                }
            });
    
            // Format self reminder with username prefix if exists
            if (dbUpdateData.selfreminder) {
                dbUpdateData.selfreminder = `${user?.username || ''}: ${dbUpdateData.selfreminder}`;
            }
    
            // Create appointment details object
            const appointmentDetails = {
                appointment_date: dbUpdateData.appointment_date || completeRow.appointment_date || "N/A",
                appointment_time: dbUpdateData.appointment_time || completeRow.appointment_time || "N/A",
                company_name: dbUpdateData.COMPANY_NAME || completeRow.COMPANY_NAME || "N/A",
                connect_person: user?.username || "N/A",
                lead_id: leadId
            };
    
            // Ensure appointment_date and Date are correctly formatted into MySQL-friendly format (YYYY-MM-DD)
            const formatToMySQLDate = (date) => {
                const parsedDate = new Date(date);
                if (isNaN(parsedDate)) return '1111-11-11'; // Return default if invalid
                return parsedDate.toISOString().split('T')[0]; // Get the YYYY-MM-DD part
            };
    
            const formattedAppointmentDate = formatToMySQLDate(dbUpdateData.appointment_date || completeRow.appointment_date);
            const formattedDate = formatToMySQLDate(dbUpdateData.Date || new Date());
    
            // Create the final update object
            const finalUpdateData = {
                ...completeRow,           
                ...dbUpdateData,          
                leads_id: leadId,
                reminder: JSON.stringify(appointmentDetails),
                time: dbUpdateData.time || completeRow.time || convertToMySQLDatetime(new Date()),
                Date: formattedDate, // Add the formatted Date
                appointment_date: formattedAppointmentDate, // Add the formatted appointment_date
                appointment_time: dbUpdateData.appointment_time || completeRow.appointment_time || '11:11:11',
                Date_and_Time: currentDateTime // Add the current date and time here
            };
    
            console.log('Final Update Data:', finalUpdateData); // Debug log
    
            const response = await api.put('/api/leads/update', {
                leads_id: leadId,
                updatedData: finalUpdateData,
                user_id: user.user_id,
                user_info: {
                    username: user?.username,
                    email: user?.email,
                    role: user?.role,
                    department: user?.department,
                    user_id: user?.user_id
                }
            });
    
            alert(response.data.message || 'Changes saved successfully!');
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Failed to save changes.');
        }
    };
    
      
  

    const formatEditableCell = (value, columnName, rowIndex, handleCellChange) => {

      if (columnName === 'Date' ) {
        return (
            <input
                type="text"
                value={value || ''}
                onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
                style={{
                    width: '150px', // Wider width for date columns
                    padding: '5px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                }}
            />
        );
    }
        if (columnName === 'Authontic') {
            return (

              
                <select 
                    value={value || 'Select'}
                    onChange={(e) => {
                        const selectedValue = e.target.value;
                        handleCellChange(rowIndex, columnName, selectedValue);
                        if (selectedValue === 'non authontic') {
                            handleCellChange(rowIndex, 'Appointment Date', '1111-11-11');
                            handleCellChange(rowIndex, 'Appointment Time', '11:11:11');
                        }
                    }}
                >
                    <option value="Select">Select</option>
                    <option value="authontic">Authontic</option>
                    <option value="non authontic">Non Authontic</option>
                </select>
            );
        }

        if (columnName === 'Custom Appointment') {
            return (
                <>
                    <select 
                        value={value || 'Select'}
                        onChange={(e) => {
                            const selectedValue = e.target.value;
                            handleCellChange(rowIndex, columnName, selectedValue);
                            if (selectedValue === 'requires') {
                                handleCellChange(rowIndex, 'Appointment Date', '1111-11-11');
                                handleCellChange(rowIndex, 'Appointment Time', '11:11:11');
                            }
                        }}
                    >
                        <option value="Select">Select</option>
                        <option value="appointment">Appointment</option>
                        <option value="requires">Requires</option>
                    </select>
                    {value === 'appointment' && (
                        <>
                            <input 
                                type="date"
                                onChange={(e) => handleCellChange(rowIndex, 'Appointment Date', e.target.value)}
                                style={{ display: 'block', marginBottom: '5px' }}
                            />
                            <input 
                                type="time"
                                onChange={(e) => handleCellChange(rowIndex, 'Appointment Time', e.target.value)}
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
                    <option value="Mustafa">Mustafa</option>
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

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="data-table-container">
          <div className="reminder-buttons">
    <button onClick={fetchAllReminders}>Fetch All Reminders</button>
    <button onClick={fetchAllSelfReminders}>Fetch Self Reminders</button>
</div>

{isAllRemindersPopupVisible && (
    <div className="popup">
        <div className="popup-content">
            <h3>All Reminders</h3>
            <ul>
                {popupReminderData.map((reminder, index) => (
                    <li key={index}>{reminder || 'No Reminder'}</li>
                ))}
            </ul>
            <button onClick={() => setIsAllRemindersPopupVisible(false)}>Close</button>
        </div>
    </div>
)}

{isSelfRemindersPopupVisible && (
    <div className="popup">
        <div className="popup-content">
            <h3>Self Reminders</h3>
            <ul>
                {popupReminderData.map((row, index) => (
                    <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ flex: 1 }}>
                            <strong>Lead ID:</strong> {row.leads_id || 'N/A'}
                        </span>
                        <span style={{ flex: 1 }}>
                            <strong>Company Name:</strong> {row.COMPANY_NAME || 'N/A'}
                        </span>
                        <span style={{ flex: 1 }}>
                            <strong>Reminder:</strong> {row.selfreminder || 'No Reminder'}
                        </span>
                        <button 
                            onClick={() => handleClearSelfReminder(row.leads_id, index)}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Clear Reminder
                        </button>
                    </li>
                ))}
            </ul>
            <button onClick={() => setIsSelfRemindersPopupVisible(false)}>Close</button>
        </div>
    </div>
)}

            <div className="table-wrapper">
                <table className="leads-table">
                    <thead>
                        <tr>
                            {displayedColumns.map(header => (
                                <th key={header} className="sticky-header">
                                    {header.toUpperCase()}
                                </th>
                            ))}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedData.map((lead, rowIndex) => (
                            <tr key={rowIndex}>
                                {displayedColumns.map(column => (
                                    <td key={column}>
                                        {formatEditableCell(
                                            lead[column],
                                            column,
                                            rowIndex,
                                            handleCellChange
                                        )}
                                    </td>
                                ))}
                                <td>
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

export default DataTableLeadsSuma;
