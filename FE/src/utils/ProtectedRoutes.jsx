import React from 'react';
import { Outlet, Navigate } from "react-router-dom";

const ProtectedRoutes = ({ allowedRoles = [] }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const isAuthenticated = token && user;
    const hasRequiredRole = allowedRoles.length === 0 || 
        (user && allowedRoles.includes(user.role));

    return isAuthenticated && hasRequiredRole 
        ? <Outlet/> 
        : <Navigate to="/login"/>;
};

export default ProtectedRoutes;