import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'; // Corrected import and added useCallback
import axios from 'axios';

const AuthContext = createContext();

// Create a separate Axios instance for authenticated requests
// This allows us to attach interceptors without affecting other axios uses
const axiosAuth = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000',
});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // Keep empty array to run only once on mount, but disable warning
  
  // Define fetchCurrentUser using useCallback to stabilize its identity
  // Now expects the JWT access token
  const fetchCurrentUser = React.useCallback(async (accessToken) => {
    try {
      // Use 'Bearer' prefix for JWT authentication
      const response = await axios.get(`${API_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${accessToken}` } 
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
  }, [API_URL]); // Add dependencies for useCallback
  
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the Simple JWT endpoint
      const response = await axios.post(`${API_URL}/api/token/`, { 
        username,
        password
      });
      
      // Simple JWT returns 'access' and 'refresh' tokens
      const { access, refresh } = response.data; 
      
      if (access) {
        // Store the access token (used for most requests)
        localStorage.setItem('token', access); 
        // Store the refresh token
        localStorage.setItem('refreshToken', refresh); 
        
        // Fetch user using the new access token
        await fetchCurrentUser(access); 
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
      // Simple JWT returns 'access' and 'refresh' tokens on registration too
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        // Store refresh token
        localStorage.setItem('refreshToken', response.data.refresh);
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
  
  // Wrap logout in useCallback
  const logout = useCallback(() => { 
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken'); // Remove refresh token on logout
    setCurrentUser(null);
    // Clear Authorization header for the axiosAuth instance upon logout
    delete axiosAuth.defaults.headers.common['Authorization'];
  }, []); // Empty dependency array as logout doesn't depend on props/state

  // --- Token Refresh Logic ---
  const refreshToken = useCallback(async () => {
    const currentRefreshToken = localStorage.getItem('refreshToken');
    if (!currentRefreshToken) {
      logout(); // No refresh token, force logout
      return Promise.reject("No refresh token available");
    }

    try {
      console.log("Attempting token refresh...");
      // Use the standard axios instance for the refresh request itself
      const response = await axios.post(`${API_URL}/api/token/refresh/`, {
        refresh: currentRefreshToken,
      });

      const { access } = response.data;
      if (access) {
        console.log("Token refreshed successfully.");
        localStorage.setItem('token', access);
        // Update the Authorization header for the axiosAuth instance
        axiosAuth.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        return access; // Return the new access token
      } else {
        throw new Error("No new access token received");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout(); // Refresh failed, force logout
      return Promise.reject(error); // Propagate the error
    }
  }, [API_URL, logout]); // Added logout as dependency for useCallback
  
  // --- Axios Interceptor for Token Refresh ---
  useEffect(() => {
    const interceptor = axiosAuth.interceptors.response.use(
      (response) => response, // Pass through successful responses
      async (error) => {
        const originalRequest = error.config;
        // Check if it's a 401 error and not a retry request already
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; // Mark as retry
          try {
            console.log("Interceptor caught 401, attempting refresh...");
            const newAccessToken = await refreshToken(); // Attempt to refresh
            // Update the header of the original request
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            // Retry the original request with the new token
            return axiosAuth(originalRequest);
          } catch (refreshError) {
            // Refresh failed (likely requires re-login), error handled in refreshToken (logout)
            return Promise.reject(refreshError);
          }
        }
        // For other errors, just reject
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on component unmount
    return () => {
      axiosAuth.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]); // Re-run if refreshToken function changes (due to its deps)


  // --- Set initial Auth header for axiosAuth if token exists ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axiosAuth.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);


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

// Export the authenticated axios instance for use in other contexts/services
export { axiosAuth };
