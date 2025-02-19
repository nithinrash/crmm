import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import './ExcelUploader.css';

const ExcelUploader = () => {
  const [excelData, setExcelData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle file upload and parse Excel data
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Extract headers and data
        const headers = [
          ...jsonData[0], 
          'SourceComment', 
          'Assignto', 
          'Status'
        ];

        const data = jsonData.slice(1).map((row) => {
          return headers.reduce((acc, header, index) => {
            acc[header] = row[index] || ''; // Map existing columns
            // Add default values for new columns
            if (header === 'SourceComment') acc[header] = '';
            if (header === 'Assignto') acc[header] = ['Suma', 'Muskan'][Math.floor(Math.random() * 2)];
            if (header === 'Status') acc[header] = 'sourcing';
            return acc;
          }, {});
        });

        setColumns(headers);
        setExcelData(data); // Update state with processed data
      } catch (err) {
        setError('Error processing file');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Handle combined upload for Leads and Audit
 

// Log all PHONE_NO values
const logPhoneNumbers = () => {
  excelData.forEach((row, index) => {
    console.log(`Row ${index + 1}: PHONE_NO = ${row.PHONE_NO || 'No Phone Number'}`);
  });
};
logPhoneNumbers()


  const handleCombinedUpload = async () => {
    if (excelData.length === 0) {
      alert('No data to upload');
      return;
    }
  
    try {
      setLoading(true);
      alert('Uploading Excel Data...');
  
      const user = JSON.parse(localStorage.getItem('user')); // Get user details from localStorage
  
      // Log updated excelData before sending
      console.log('Excel Data being sent to Leads:', excelData);
  
      // Step 1: Upload to Leads
      const leadsResponse = await api.post('/api/sourceleads/upload/leads', {
        data: excelData,
        user: user,
      });
  
      console.log('Leads API Response:', leadsResponse.data);
  
      const { insertedLeads } = leadsResponse.data;
  
      if (!insertedLeads || insertedLeads.length === 0) {
        alert('No leads were assigned IDs.');
        return;
      }
  
      // Step 2: Update excelData with lead_id values
      const updatedExcelData = excelData.map((row, index) => ({
        ...row,
        leads_id: insertedLeads[index]?.leads_id || null, // Add lead_id to each row
      }));
      setExcelData(updatedExcelData); // Update state with new data
  
      // Log updated data before sending to Audit
      console.log('Excel Data being sent to Audit:', updatedExcelData);
  
      // Step 3: Upload to Audit
      const auditResponse = await api.post('/api/audit/upload/audit', {
        data: updatedExcelData,
        user: user,
      });
  
      console.log('Audit API Response:', auditResponse.data);
  
      alert('Excel Data Uploaded Successfully To Leads and Audit!');
    } catch (error) {
      console.error("API Error:", error);
      alert("Error Uploading Excel Data.");
    } finally {
      setLoading(false);
    }
  };
  

  // Handle cell value changes in the table
  const handleCellChange = (columnName, newValue) => {
    const updatedData = [...excelData];
  
    if (columnName === 'Assignto' || columnName === 'Status') {
      // Update Assignto for all rows
      updatedData.forEach((row) => {
        row[columnName] = newValue;
      });
    }
  
    setExcelData(updatedData); // Update state with modified data
  };
  
  
  // Format cell value for editable inputs or dropdowns
  const formatCellValue = (value, columnName, rowIndex) => {
    if (columnName === 'Status') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={value === 'sourcing'} 
              onChange={() => handleCellChange('Status', 'sourcing')} 
            />
            Sourcing
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={value === 'lead'} 
              onChange={() => handleCellChange('Status', 'lead')} 
            />
            Lead
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={value === 'sales'} 
              onChange={() => handleCellChange('Status', 'sales')} 
            />
            Sales
          </label>
        </div>
      );
    }
    

    if (columnName === 'Assignto') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={value === 'Suma'} 
              onChange={() => handleCellChange('Assignto', 'Suma')} 
            />
            Suma
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={value === 'Muskan'} 
              onChange={() => handleCellChange('Assignto', 'Muskan')} 
            />
            Muskan
          </label>
          
          <label>
            <input 
              type="checkbox" 
              checked={value === 'Shiva'} 
              onChange={() => handleCellChange('Assignto', 'Shiva')} 
            />
            Shiva
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={value === 'Pushpendra'} 
              onChange={() => handleCellChange('Assignto', 'Pushpendra')} 
            />
            Pushpendra
          </label>
          
        </div>
      );
    }
    

    return (
      <input 
        type="text" 
        value={value || ''}
        onChange={(e) => handleCellChange(rowIndex, columnName, e.target.value)}
        style={{
          width: '100%',
          padding: '5px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      />
    );
  };

  return (
    <div className="excel-uploader-container">
      {/* File Upload Input */}
      <div className="upload-container">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload} 
          className="file-input"
        />
      </div>

      {/* Upload Button */}
      <div className="upload-buttons">
        <button 
          onClick={handleCombinedUpload}
          disabled={excelData.length === 0 || loading}
          className="upload-btn"
        >
          {loading ? 'Uploading...' : 'Upload to Leads & Audit'}
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error">{error}</div>}

      {/* Data Table */}
      {excelData.length > 0 && (
        <div className="table-wrapper">
          <div className="table-scroll-container">
            <table className="excel-table">
              {/* Table Header */}
              <thead>
                <tr>
                  {columns.map((header, index) => (
                    <th key={index} className="sticky-header">
                      {header.toString().toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {excelData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((header, colIndex) => (
                      <td key={colIndex}>
                        {formatCellValue(row[header], header, rowIndex)}
                      </td>
                    ))}
                  </tr> 
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;
