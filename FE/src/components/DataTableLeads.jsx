import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import './DataTableLeads.css';

const DataTableLeads = () => {
  const [leadsData, setLeadsData] = useState([]); // Complete leads data
  const [displayedData, setDisplayedData] = useState([]); // Data currently displayed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Search term for filtering
  const [alertMessage, setAlertMessage] = useState(''); // Alert message state
  const [repeatedPhones, setRepeatedPhones] = useState([]); // Repeated phone numbers
  const [showModal, setShowModal] = useState(false); // Modal visibility state

  const tableScrollContainerRef = useRef(null); // For vertical scrolling
  const tableRef = useRef(null); // Reference to the table
  const observer = useRef(); // Intersection observer for infinite scroll

  // Retrieve user data from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.user_id;

  // Helper function to format ISO datetime strings to MySQL-compatible format
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

  // Helper function to format ISO datetime strings to 'YYYY-MM-DD' for date fields
  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    
    const date = new Date(isoDate);
    
    // Normalize the date to the UTC midnight (00:00:00) to avoid timezone issues
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); 
    
    // Return the date in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
};


  // Infinite scroll trigger
  const loadMoreTriggerRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && displayedData.length < leadsData.length) {
          loadMoreData();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, displayedData, leadsData]
  );

  // Fetch Leads Data
  useEffect(() => {
    const fetchLeadsData = async () => {
      try {
        const response = await api.get('/api/leads');
        setLeadsData(response.data);
        setDisplayedData(response.data.slice(0, 50));
        setLoading(false);

        findRepeatedPhoneNumbers(response.data);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        setAlertMessage(`Error loading leads: ${err.message}`);
      }
    };

    fetchLeadsData();
  }, []);

  // Handle Save Button for Each Row
  const handleRowSave = async (rowIndex) => {
    try {
      // Fetch the current row's data
      const currentRow = displayedData[rowIndex];
  
      if (!currentRow.leads_id) {
        console.error('Error: leads_id is undefined for row:', currentRow);
        alert('Error: leads_id is missing. Cannot save changes.');
        return;
      }
  
      // Prepare updated data by merging current and new values
      const updatedData = { ...currentRow };
  
      // Format date fields if they exist
      if (updatedData.time) {
        updatedData.time = convertToMySQLDatetime(updatedData.time);
      }
      if (updatedData.Date) {
        updatedData.Date = formatDate(updatedData.Date);
      }
      if (updatedData.appointment_date) {
        updatedData.appointment_date = formatDate(updatedData.appointment_date);
      }
  
      // Merge logic: Remove empty or undefined fields from the payload
      const finalUpdatedData = {};
      Object.keys(updatedData).forEach((key) => {
        if (updatedData[key] !== null && updatedData[key] !== undefined && updatedData[key] !== '') {
          finalUpdatedData[key] = updatedData[key];
        }
      });
  
      console.log('Final Updated Row Data Sent to Backend:', finalUpdatedData);
  
      // Send the merged data to the backend
      await api.put('/api/leads/update', { 
        leads_id: currentRow.leads_id,
        updatedData: finalUpdatedData,
        user_id: userId, // Include user_id in the backend request payload
      });
  
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes.');
    }
  };
  

  // Function to find repeated phone numbers
  const findRepeatedPhoneNumbers = (data) => {
    const phoneNumberMap = {};

    data.forEach((lead, index) => {
      const phoneNumber = lead.PHONE_NO;
      if (phoneNumber) {
        if (phoneNumberMap[phoneNumber]) {
          phoneNumberMap[phoneNumber].push(index + 1);
        } else {
          phoneNumberMap[phoneNumber] = [index + 1];
        }
      }
    });

    const duplicates = Object.keys(phoneNumberMap)
      .filter((phoneNumber) => phoneNumberMap[phoneNumber].length > 1)
      .map((phoneNumber) => ({
        phoneNumber,
        rows: phoneNumberMap[phoneNumber],
      }));

    if (duplicates.length > 0) {
      setRepeatedPhones(duplicates);
      setShowModal(true);
    }
  };

  // Load More Data Function for Infinite Scroll
  const loadMoreData = () => {
    const currentLength = displayedData.length;
    const nextBatch = leadsData.slice(currentLength, currentLength + 50);

    setDisplayedData((prev) => [...prev, ...nextBatch]);
    setAlertMessage('Loaded more leads!');
    setTimeout(() => setAlertMessage(''), 2000);
  };

  // Filtered Search Functionality
  const filteredData = leadsData.filter((lead) =>
    Object.values(lead).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="data-table-container">
      {alertMessage && <div className="alert-box">{alertMessage}</div>}

      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search leads..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-wrapper">
        <div className='scrollable-container'>
        <table className="leads-table">
          <thead>
            <tr>
              <th>Row Number</th>
              {leadsData.length > 0 &&
                Object.keys(leadsData[0]).map((header) => (
                  <th key={header}>{header.replace(/_/g, ' ').toUpperCase()}</th>
                ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((lead, rowIndex) => (
              <tr key={rowIndex}>
                <td>{rowIndex + 1}</td>
                {Object.entries(lead).map(([key, value], cellIndex) => (
                  <td key={cellIndex}>
                    {key === 'time' || key === 'created_at' || key === 'updated_at' ? (
                      <input
                        type="text"
                        value={convertToMySQLDatetime(value)}
                        onChange={(e) => {
                          const updatedLeads = [...leadsData];
                          updatedLeads[rowIndex][key] = e.target.value;
                          setLeadsData(updatedLeads);

                          if (rowIndex < displayedData.length) {
                            const updatedDisplayedData = [...displayedData];
                            updatedDisplayedData[rowIndex][key] = e.target.value;
                            setDisplayedData(updatedDisplayedData);
                          }
                        }}
                        className="editable-cell"
                      />
                    ) : key === 'Date' || key === 'appointment_date' ? (
                      <input
                        type="date"
                        value={formatDate(value)}
                        onChange={(e) => {
                          const updatedLeads = [...leadsData];
                          updatedLeads[rowIndex][key] = e.target.value;
                          setLeadsData(updatedLeads);

                          if (rowIndex < displayedData.length) {
                            const updatedDisplayedData = [...displayedData];
                            updatedDisplayedData[rowIndex][key] = e.target.value;
                            setDisplayedData(updatedDisplayedData);
                          }
                        }}
                        className="editable-cell"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value ?? ''}
                        onChange={(e) => {
                          const updatedLeads = [...leadsData];
                          updatedLeads[rowIndex][key] = e.target.value;
                          setLeadsData(updatedLeads);

                          if (rowIndex < displayedData.length) {
                            const updatedDisplayedData = [...displayedData];
                            updatedDisplayedData[rowIndex][key] = e.target.value;
                            setDisplayedData(updatedDisplayedData);
                          }
                        }}
                        className="editable-cell"
                      />
                    )}
                  </td>
                ))}
                <td>
                  <button onClick={() => handleRowSave(rowIndex)} className="save-row-button">
                    Save
                  </button>
                </td>
              </tr>
              
            ))}
            
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Repeated Phone Numbers</h2>
            <ul>
              {repeatedPhones.map(({ phoneNumber, rows }, index) => (
                <li key={index}>
                  Phone Number: {phoneNumber}, Rows: {rows.join(', ')}
                </li>
              ))}
            </ul>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTableLeads;
