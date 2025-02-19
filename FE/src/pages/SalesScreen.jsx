import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Home.css";
import Navbar from '../components/Navbar';
import DataTableLeadsShiva from '../components/DataTableLeadsShiva';
import api from '../services/api';

function SalesScreen() {
  const navigate = useNavigate();
  
  // Retrieve user data from localStorage
  const user = JSON.parse(localStorage.getItem('user')); // Assuming user data is stored in localStorage

  useEffect(() => {
    // Check if user is logged in and has the "Sales" role
    if (!user || user.role !== 'Sales') {
      // Redirect unauthorized users
      navigate('/login'); // Or '/login'
    }
  }, [user, navigate]);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handlePushData = async (data) => {
    try {
      if (!user || !user.user_id) {
        alert('User ID is missing. Please log in again.');
        return;
      }

      // Add user_id to the data being sent to the backend
      const response = await api.post('/api/push', { 
        data, 
        user_id: user.user_id // Pass user_id to backend
      });

      alert(response.data.message || "Data pushed successfully!");
    } catch (error) {
      console.error("Error pushing data:", error);
      alert("Failed to push data.");
    }
  };

  return (
    <div>
      <Navbar />
      
      {/* Data Table for Leads */}
      <DataTableLeadsShiva />

      {/* Detailed User Information */}
      <div className="user-profile-container">
        {/* Display user details */}
        {/* Uncomment and customize if needed */}
        {/* <h2>Welcome, {user?.full_name || "User"}!</h2> */}
      </div>

      {/* Push Data Button */}
      <div className="push-data-container">
       
      </div>

      {/* Logout Button */}
      
    </div>
  );
}

export default SalesScreen;
