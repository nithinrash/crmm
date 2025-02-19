import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Home.css";
import Navbar from '../components/Navbar';
import DataTableLeads from '../components/DataTableLeads';
import ExcelUploader from '../components/ExcelUploader';

function Home() {
  const navigate = useNavigate();

  // Retrieve user data from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Check if user is logged in and has the "Sourcing" role
    if (!user || user.role !== 'Sourcing') {
      // Redirect unauthorized users
      navigate('/login'); // Or '/login'
    }
  }, [user, navigate]);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div>
      <Navbar />
      
      {/* Detailed User Information */}
      <div className="user-profile-container">
        <div className="user-details">
          {/* Add user details here */}
        </div>
      </div>
      
      <DataTableLeads />
      <ExcelUploader />
      
      {/* Logout Button */}

    </div>
  );
}

export default Home;
