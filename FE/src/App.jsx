import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import LeadScreen from './pages/LeadScreen';
import SalesScreen from './pages/SalesScreen';
import ProtectedRoutes from './utils/ProtectedRoutes';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path='/LeadScreen' element={<LeadScreen/>}/>
          <Route path='/SalesScreen' element={<SalesScreen/>}/>
        </Route>

        {/* 404 Not Found Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;