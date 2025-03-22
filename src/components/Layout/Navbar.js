import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="merchant-navbar">
      <div className="navbar-logo">
        <Link to="/">
          <span className="logo-icon">🧭</span>
          <span className="logo-text">Silk Road Trading</span>
        </Link>
      </div>
      
      <div className="navbar-links">
        {currentUser ? (
          <>
            <Link to="/orders" className="nav-link">Orders</Link>
            <button onClick={handleLogout} className="nav-link logout-button">
              Logout
            </button>
            <div className="user-profile">
              <span className="merchant-icon">👤</span>
              <span className="username">{currentUser.username}</span>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
