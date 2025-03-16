import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);
  
  const fetchCurrentUser = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/users/me/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setCurrentUser(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setCurrentUser(null);
      setError('Authentication failed. Please log in again.');
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/token/`, {
        username,
        password
      });
      
      const { token } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        await fetchCurrentUser(token);
        return true;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setCurrentUser(null);
      
      if (error.response && error.response.data) {
        if (error.response.data.non_field_errors) {
          setError(error.response.data.non_field_errors[0]);
        } else if (error.response.data.detail) {
          setError(error.response.data.detail);
        } else {
          setError('Invalid credentials. Please try again.');
        }
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/users/register/`, userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setCurrentUser(response.data.user);
        return true;
      } else {
        throw new Error('Registration successful but no token received');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      
      if (error.response && error.response.data) {
        // Format validation errors
        const errors = [];
        for (const field in error.response.data) {
          if (Array.isArray(error.response.data[field])) {
            errors.push(`${field}: ${error.response.data[field].join(' ')}`);
          }
        }
        
        if (errors.length > 0) {
          setError(errors.join('\n'));
        } else {
          setError('Registration failed. Please try again with different information.');
        }
      } else {
        setError('Registration failed. Please check your connection and try again.');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };
  
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
