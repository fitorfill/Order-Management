import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon">🧭</div>
        <p>Preparing the merchant's ledger...</p>
      </div>
    );
  }
  
  return currentUser ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
