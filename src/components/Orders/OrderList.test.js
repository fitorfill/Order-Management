import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios'; // Import axios to mock it
import { BrowserRouter } from 'react-router-dom';
import { OrderProvider } from '../../context/OrderContext'; // Import the actual provider
import OrderList from './OrderList'; // The component we are testing

// Mock axios
jest.mock('axios');
const mockedAxios = axios; // Alias for clarity

// Helper function to render with providers
const renderOrderListComponent = () => {
  return render(
    <BrowserRouter>
      <OrderProvider>
        <OrderList />
      </OrderProvider>
    </BrowserRouter>
  );
};

describe('OrderList Component - API Integration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedAxios.get.mockClear();
    // Mock non-order API calls (customers, products, metrics) made in OrderProvider useEffect
    // to prevent errors if OrderList doesn't directly use them but provider fetches them.
    // Assume they return empty arrays or default values for simplicity in this test.
    mockedAxios.get.mockImplementation((url) => {
       if (url.includes('/api/customers')) {
         return Promise.resolve({ data: [] });
       }
       if (url.includes('/api/products')) {
         return Promise.resolve({ data: [] });
       }
       if (url.includes('/api/orders/metrics')) {
         // Mock metrics endpoint called by OrderProvider
         return Promise.resolve({ data: { totalOrders: 0, pending: 0 } });
       }
       // Default mock for other GET requests if needed
       return Promise.resolve({ data: {} });
    });
  });

  test('fetches and displays orders on initial render', async () => {
    const mockOrders = [
      { id: 1, order_number: 'ORD-001', status: 'Pending', total_amount: '100.00', created_at: new Date().toISOString(), items: [{ id: 10, product_name: 'Item A', quantity: 1, price_per_item: '100.00' }] },
      { id: 2, order_number: 'ORD-002', status: 'Delivered', total_amount: '50.50', created_at: new Date().toISOString(), items: [{ id: 11, product_name: 'Item B', quantity: 2, price_per_item: '25.25' }] },
    ];

    // Specific mock for the order fetching endpoint (overrides the default mock)
    mockedAxios.get.mockResolvedValueOnce({ data: mockOrders });

    renderOrderListComponent();

    // Check for loading state initially (if OrderList shows one)
    // expect(screen.getByText(/loading/i)).toBeInTheDocument(); // Example

    // Wait for orders to be fetched and rendered
    // Use findBy queries which wait for elements to appear
    expect(await screen.findByText('ORD-001')).toBeInTheDocument();
    expect(await screen.findByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument(); // Check status
    expect(screen.getByText(/delivered/i)).toBeInTheDocument(); // Check status

    // Verify axios was called correctly for orders
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders'), // Check if it calls the Node.js order service URL
      expect.any(Object) // Headers object
    );
  });

  test('displays an error message if fetching orders fails', async () => {
    const errorMessage = 'Failed to fetch orders';
    // Mock the orders GET request to fail
    mockedAxios.get.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

    renderOrderListComponent();

    // Wait for the error message to be displayed
    // This depends on how OrderList or OrderProvider displays errors
    expect(await screen.findByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();

     // Verify axios was called
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders'),
      expect.any(Object)
    );
  });

   test('displays message when no orders are available', async () => {
    // Mock the orders GET request to return an empty array
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    renderOrderListComponent();

    // Wait for a "no orders" message (assuming OrderList implements this)
    expect(await screen.findByText(/no orders found/i)).toBeInTheDocument(); // Example message

    // Verify axios was called
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders'),
      expect.any(Object)
    );
  });
});
