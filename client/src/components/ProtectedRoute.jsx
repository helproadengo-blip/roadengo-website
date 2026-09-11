// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, userType = 'mechanic' }) => {
  const location = useLocation();
  
  // Check for appropriate token based on user type
  const getToken = () => {
    if (userType === 'admin') {
      return localStorage.getItem('adminToken');
    } else if (userType === 'mechanic') {
      return localStorage.getItem('mechanicToken');
    } else if (userType === 'partner') {
      return localStorage.getItem('partnerToken');
    }
    return null;
  };

  const token = getToken();
  
  if (!token) {
    console.log(`No ${userType} token found, redirecting to login`);
    
    // Redirect to appropriate login page
    const loginPath =
      userType === 'admin' ? '/admin/login' : userType === 'partner' ? '/partner/login' : '/mechanic/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }
  
  console.log(`${userType} token found, allowing access`);
  return children;
};

export default ProtectedRoute;
