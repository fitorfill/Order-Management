import React, { createContext, useContext, useReducer, useEffect } from 'react';
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

    // Add other cases for customers and products...
    
    default:
      return state;
  }
}

// Custom hook to use the order context
export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
