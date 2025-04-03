import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OrderDashboard from './components/Orders/OrderDashboard';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Navbar from './components/Layout/Navbar';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext'; // Import OrderProvider
import AddProductForm from './components/Management/AddProductForm';
import AddCustomerForm from './components/Management/AddCustomerForm';
import './styles/App.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            {/* Wrap routes needing OrderContext with OrderProvider */}
            <OrderProvider> 
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <OrderDashboard />
                  </ProtectedRoute>
                }
              />
               <Route 
                path="/add-product" 
                element={
                  <ProtectedRoute>
                    <AddProductForm />
                  </ProtectedRoute>
                } 
              />
               <Route 
                path="/add-customer" 
                element={
                  <ProtectedRoute>
                    <AddCustomerForm />
                  </ProtectedRoute>
                } 
                />
                <Route path="/" element={<Navigate to="/orders" replace />} />
              </Routes>
            </OrderProvider>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
