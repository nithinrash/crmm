import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <Link to="/">Winger-IT Software</Link>
        </div>

        {/* Profile Dropdown */}
        <ul className="nav-menu">
          <li className="nav-item profile-dropdown">
            <div 
              className="nav-link profile-trigger"
              onClick={toggleProfileDropdown}
            >
              <FaUser />
              <span>Profile</span>
            </div>
            {isProfileDropdownOpen && (
              <div className="dropdown-menu">
                <div className="profile-info">
                  <h3>{user?.full_name || user?.username}</h3>
                  <p>User ID: {user?.user_id}</p>
                  <p>Role: {user?.role}</p>
                </div>
                <div 
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
