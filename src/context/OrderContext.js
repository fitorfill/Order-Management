import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import axios from 'axios';

// Order Context
const OrderContext = createContext();

// Initial state
const initialState = {
  orders: [],
  loading: false,
  error: null,
  filters: {
    status: 'all',     // 'all', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
    payment: 'all',    // 'all', 'GOLD', 'SILVER', 'BARTER', 'CREDIT'
    search: ''
  },
  sorting: {
    field: 'created_at', // 'order_number', 'created_at', 'total', 'customer'
    direction: 'desc'   // 'asc', 'desc'
  },
  customers: [],       // To store available customers
  products: [],        // To store available products
  customersLoading: false,
  productsLoading: false,
  customersError: null,
  productsError: null
};

// Action types
const actions = {
  FETCH_ORDERS_START: 'FETCH_ORDERS_START',
  FETCH_ORDERS_SUCCESS: 'FETCH_ORDERS_SUCCESS',
  FETCH_ORDERS_ERROR: 'FETCH_ORDERS_ERROR',
  ADD_ORDER: 'ADD_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  DELETE_ORDER: 'DELETE_ORDER',
  SET_FILTER: 'SET_FILTER',
  SET_SORT: 'SET_SORT',
  FETCH_CUSTOMERS_START: 'FETCH_CUSTOMERS_START',
  FETCH_CUSTOMERS_SUCCESS: 'FETCH_CUSTOMERS_SUCCESS',
  FETCH_CUSTOMERS_ERROR: 'FETCH_CUSTOMERS_ERROR',
  FETCH_PRODUCTS_START: 'FETCH_PRODUCTS_START',
  FETCH_PRODUCTS_SUCCESS: 'FETCH_PRODUCTS_SUCCESS',
  FETCH_PRODUCTS_ERROR: 'FETCH_PRODUCTS_ERROR'
};

// Reducer function
function orderReducer(state, action) {
  switch (action.type) {
    case actions.FETCH_ORDERS_START:
      return { ...state, loading: true, error: null };
    
    case actions.FETCH_ORDERS_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        orders: action.payload,
        error: null 
      };
    
    case actions.FETCH_ORDERS_ERROR:
      return { ...state, loading: false, error: action.payload };
    
    case actions.ADD_ORDER:
      return { 
        ...state, 
        orders: [...state.orders, action.payload],
      };
    
    case actions.UPDATE_ORDER: {
      const updatedOrders = state.orders.map(order => 
        order.id === action.payload.id ? { ...order, ...action.payload } : order
      );
      return { ...state, orders: updatedOrders };
    }
    
    case actions.DELETE_ORDER:
      return { 
        ...state, 
        orders: state.orders.filter(order => order.id !== action.payload)
      };
    
    case actions.SET_FILTER:
      return { 
        ...state, 
        filters: { ...state.filters, [action.payload.key]: action.payload.value } 
      };
    
    case actions.SET_SORT:
      return { 
        ...state, 
        sorting: { 
          field: action.payload.field, 
          direction: action.payload.field === state.sorting.field && 
                     state.sorting.direction === 'asc' ? 'desc' : 'asc' 
        } 
      };
    
    case actions.FETCH_CUSTOMERS_SUCCESS:
      return { ...state, customers: action.payload, customersLoading: false };
      
    case actions.FETCH_CUSTOMERS_ERROR:
      return { ...state, customersError: action.payload, customersLoading: false };
      
    case actions.FETCH_CUSTOMERS_START:
      return { ...state, customersLoading: true, customersError: null };
      
    case actions.FETCH_PRODUCTS_SUCCESS:
      return { ...state, products: action.payload, productsLoading: false };
      
    case actions.FETCH_PRODUCTS_ERROR:
      return { ...state, productsError: action.payload, productsLoading: false };
      
    case actions.FETCH_PRODUCTS_START:
      return { ...state, productsLoading: true, productsError: null };
      
    default:
      return state;
  }
}

// OrderProvider component
export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, {
    ...initialState,
    customers: [],
    products: [],
    customersLoading: false,
    productsLoading: false,
    customersError: null,
    productsError: null,
    metrics: null,
    metricsLoading: false
  });
  
  const [filteredSortedOrders, setFilteredSortedOrders] = useState([]);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  
  // Get the token for authenticated requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Token ${token}` } : {};
  };
  
  // Fetch orders
  const fetchOrders = async () => {
    dispatch({ type: actions.FETCH_ORDERS_START });
    
    try {
      const response = await axios.get(`${API_URL}/api/orders/`, {
        headers: getAuthHeader()
      });
      
      dispatch({ 
        type: actions.FETCH_ORDERS_SUCCESS,
        payload: response.data 
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      dispatch({ 
        type: actions.FETCH_ORDERS_ERROR,
        payload: error.response?.data?.detail || 'Failed to fetch orders' 
      });
    }
  };
  
  // Add a new order
  const addOrder = async (orderData) => {
    try {
      const response = await axios.post(`${API_URL}/api/orders/`, orderData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      dispatch({
        type: actions.ADD_ORDER,
        payload: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error.response?.data || error;
    }
  };
  
  // Update an order
  const updateOrder = async (orderId, orderData) => {
    try {
      const response = await axios.patch(`${API_URL}/api/orders/${orderId}/`, orderData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      dispatch({
        type: actions.UPDATE_ORDER,
        payload: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error.response?.data || error;
    }
  };
  
  // Delete an order
  const deleteOrder = async (orderId) => {
    try {
      await axios.delete(`${API_URL}/api/orders/${orderId}/`, {
        headers: getAuthHeader()
      });
      
      dispatch({
        type: actions.DELETE_ORDER,
        payload: orderId
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error.response?.data || error;
    }
  };
  
  // Set filter
  const setFilter = (key, value) => {
    dispatch({
      type: actions.SET_FILTER,
      payload: { key, value }
    });
  };
  
  // Set sort
  const setSort = (field) => {
    dispatch({
      type: actions.SET_SORT,
      payload: { field }
    });
  };
  
  // Fetch customers
  const fetchCustomers = async () => {
    dispatch({ type: actions.FETCH_CUSTOMERS_START });
    
    try {
      const response = await axios.get(`${API_URL}/api/customers/`, {
        headers: getAuthHeader()
      });
      
      dispatch({ 
        type: actions.FETCH_CUSTOMERS_SUCCESS,
        payload: response.data 
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      dispatch({ 
        type: actions.FETCH_CUSTOMERS_ERROR,
        payload: error.response?.data?.detail || 'Failed to fetch customers' 
      });
    }
  };
  
  // Fetch products
  const fetchProducts = async () => {
    dispatch({ type: actions.FETCH_PRODUCTS_START });
    
    try {
      const response = await axios.get(`${API_URL}/api/products/`, {
        headers: getAuthHeader()
      });
      
      dispatch({ 
        type: actions.FETCH_PRODUCTS_SUCCESS,
        payload: response.data 
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      dispatch({ 
        type: actions.FETCH_PRODUCTS_ERROR,
        payload: error.response?.data?.detail || 'Failed to fetch products' 
      });
    }
  };
  
  // Fetch metrics
  const fetchMetrics = async () => {
    setState(prev => ({ ...prev, metricsLoading: true }));
    
    try {
      const response = await axios.get(`${API_URL}/api/orders/metrics/`, {
        headers: getAuthHeader()
      });
      
      setState(prev => ({ 
        ...prev, 
        metrics: response.data,
        metricsLoading: false
      }));
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setState(prev => ({ 
        ...prev, 
        metricsLoading: false 
      }));
    }
  };
  
  // Use a separate state for metrics since it's not part of the reducer
  const [extraState, setState] = useState({
    metrics: null,
    metricsLoading: false
  });
  
  // Filter and sort orders
  useEffect(() => {
    let result = [...state.orders];
    
    // Apply filters
    if (state.filters.status !== 'all') {
      result = result.filter(order => order.status === state.filters.status);
    }
    
    if (state.filters.payment !== 'all') {
      result = result.filter(order => order.payment_method === state.filters.payment);
    }
    
    if (state.filters.search) {
      const searchLower = state.filters.search.toLowerCase();
      result = result.filter(order => 
        order.order_number.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.shipping_address?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA, valueB;
      
      switch (state.sorting.field) {
        case 'order_number':
          valueA = a.order_number;
          valueB = b.order_number;
          break;
        case 'created_at':
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
        case 'total':
          valueA = a.total;
          valueB = b.total;
          break;
        case 'customer_name':
          valueA = a.customer_name || '';
          valueB = b.customer_name || '';
          break;
        default:
          valueA = a.created_at;
          valueB = b.created_at;
      }
      
      if (state.sorting.direction === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredSortedOrders(result);
  }, [state.orders, state.filters, state.sorting]);
  
  // Initial data loading
  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
    fetchMetrics();
  }, []);
  
  const contextValue = {
    ...state,
    ...extraState,
    filteredSortedOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    setFilter,
    setSort,
    fetchOrders,
    fetchCustomers,
    fetchProducts,
    fetchMetrics
  };
  
  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook to use the order context
export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
