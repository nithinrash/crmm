import React, { useState } from 'react';
import api from '../services/api';
import './LeadSearch.css';

const LeadSearch = () => {
  const [leadId, setLeadId] = useState('');
  const [leadResults, setLeadResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    // Reset previous states
    setLeadResults([]);
    setError(null);
    setLoading(true);

    try {
      // API call to search leads
      const response = await api.get(`/api/leads/search?lead_id=${leadId}`);
      
      if (response.data.length > 0) {
        setLeadResults(response.data);
      } else {
        setError('No leads found with this ID');
      }
    } catch (err) {
      setError('Error searching leads');
      console.error('Lead Search Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lead-search-container">
      <div className="search-input-container">
        <input 
          type="text" 
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          placeholder="Enter Lead ID"
          className="lead-search-input"
        />
        <button 
          onClick={handleSearch} 
          className="search-button"
          disabled={!leadId}
        >
          Search
        </button>
      </div>

      {loading && <div className="loading">Searching...</div>}
      
      {error && <div className="error">{error}</div>}

      {leadResults.length > 0 && (
        <div className="results-table-container">
          <table className="leads-table">
            <thead>
              <tr>
                {Object.keys(leadResults[0]).map(header => (
                  <th key={header}>
                    {header.replace(/_/g, ' ').toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leadResults.map((lead, index) => (
                <tr key={index}>
                  {Object.values(lead).map((value, cellIndex) => (
                    <td key={cellIndex}>
                      {value instanceof Date 
                        ? value.toLocaleDateString() 
                        : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadSearch;
