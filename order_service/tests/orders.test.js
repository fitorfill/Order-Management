const request = require('supertest');
const app = require('../server'); // Import the Express app
const db = require('../db'); // Import the db module to mock its query function
const jwt = require('jsonwebtoken'); // To sign mock tokens

// --- Mocking ---
// Mock the database query function with default implementations
jest.mock('../db', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
  const mockPoolClient = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn(),
  };
  const mockDb = { // Define the mock object separately
    query: mockQuery,
    pool: {
      connect: jest.fn().mockResolvedValue(mockPoolClient),
    },
  };
  return mockDb; // Return the defined object
});

// --- REMOVED Global Mock for authMiddleware ---
// Individual tests will handle auth mocking/testing as needed.


// --- Test Suite ---
describe('Order API Endpoints', () => {
  let mockClient; // To hold the mock client for transaction tests

  // Corrected beforeEach structure
  beforeEach(async () => { // Make async to handle promise
    // Reset mocks before each test
    db.query.mockClear();

    // Get the mock client instance setup in the mock
    // Ensure the mock setup for connect returns the client correctly
    const client = await db.pool.connect();
    client.query.mockClear();
    client.release.mockClear();
    mockClient = client; // Store mock client for transaction tests

    // Ensure subsequent calls to connect in tests get the same mocked client
    // This might be redundant if the initial mock setup handles it, but ensures consistency
    db.pool.connect.mockResolvedValue(mockClient);

    // Note: jest.unmock was removed from here as it's better handled
    // within specific describe blocks using beforeAll/afterAll if needed.
  });


  // --- Authentication Error Handling ---
  describe('Authentication Middleware', () => {
      // These tests will now hit the actual middleware or specific mocks

      it('should return 401 if no token is provided', async () => {
          // No need for isolateModules now, just make the request without a token
          const response = await request(app).get('/api/orders'); 
          expect(response.statusCode).toBe(401);
          expect(response.body.message).toBe('Authentication token required');
      });

      it('should return 401 if token is expired', async () => {
          // This mock should now work correctly as the middleware isn't globally mocked
          // Mock jwt.verify to throw TokenExpiredError
          const verifyMock = jest.spyOn(jwt, 'verify').mockImplementation(() => {
              const error = new Error('Token expired');
              error.name = 'TokenExpiredError';
              throw error;
          });

          const response = await request(app)
              .get('/api/orders')
              .set('Authorization', 'Bearer expiredtoken');

          expect(response.statusCode).toBe(401);
          expect(response.body.message).toBe('Token expired');
          verifyMock.mockRestore();
      });

      it('should return 403 if token is invalid', async () => {
          // This mock should now work correctly
          const verifyMock = jest.spyOn(jwt, 'verify').mockImplementation(() => {
              throw new Error('Invalid signature');
          });

          const response = await request(app)
              .get('/api/orders')
              .set('Authorization', 'Bearer invalidtoken');

          expect(response.statusCode).toBe(403);
          expect(response.body.message).toBe('Invalid or malformed token');
          verifyMock.mockRestore();
      });
  });


  // --- Test POST /api/orders ---
  describe('POST /api/orders', () => {
     // NOTE: Since the global auth mock is removed, these tests might fail
     // if they rely on req.userId being automatically set.
     // We might need to add a valid mock token header or mock the middleware
     // specifically for these tests if they start failing.
     // For now, let's see if they pass with the DB mock only.

    it('should create a new order and return 201', async () => {
      // Use product ID and unit_price to match controller expectations
      const mockOrderData = {
        items: [
          { product: 1, quantity: 2, unit_price: 10.50 }, // Product ID 1
          { product: 2, quantity: 1, unit_price: 5.00 }  // Product ID 2
        ]
      };
      // Note: The controller recalculates totalAmount based on quantity * unit_price,
      // but the test assertion below uses the value returned from the mocked DB insert.
      // Let's keep the calculation here for clarity, but the mock drives the result.
      const expectedTotal = (2 * 10.50) + (1 * 5.00); // 21 + 5 = 26

      // Mock DB responses for the transaction
      // 1. BEGIN
      mockClient.query.mockResolvedValueOnce({});
      // 2. INSERT into orders
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 101, status: 'Pending', total_amount: expectedTotal.toString(), created_at: new Date() }] });
      // 3. SELECT product name for item 1 (product ID 1)
      mockClient.query.mockResolvedValueOnce({ rows: [{ name: 'Test Product 1' }] });
      // 4. SELECT product name for item 2 (product ID 2)
      mockClient.query.mockResolvedValueOnce({ rows: [{ name: 'Test Product 2' }] });
      // 5. INSERT into order_items (item 1)
      mockClient.query.mockResolvedValueOnce({});
      // 6. INSERT into order_items (item 2)
      mockClient.query.mockResolvedValueOnce({});
      // 7. COMMIT
      mockClient.query.mockResolvedValueOnce({});

      // Add a mock token header with the correct payload key 'user_id'
      const mockToken = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET || 'test-secret'); 
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${mockToken}`) // Add mock token
        .send(mockOrderData);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('Order created successfully');
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe(101);
      // The controller returns the original items array, not the one with names
      expect(response.body.order.items).toEqual(mockOrderData.items); 

      // Verify transaction flow
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      // Verify INSERT with correct total
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO orders'), [1, expectedTotal, 'Pending']); 
      // Verify product name lookups
      expect(mockClient.query).toHaveBeenCalledWith('SELECT name FROM products WHERE id = $1', [1]);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT name FROM products WHERE id = $1', [2]);
      // Verify item insertions with looked-up names
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO order_items'), [101, 'Test Product 1', 2, 10.50]);
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO order_items'), [101, 'Test Product 2', 1, 5.00]);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1); // Ensure client is released
    });

    it('should return 400 if items array is missing or empty', async () => {
      const response1 = await request(app).post('/api/orders').send({});
      const response2 = await request(app).post('/api/orders').send({ items: [] });

      expect(response1.statusCode).toBe(400);
      expect(response1.body.message).toBe('Order items are required');
      expect(response2.statusCode).toBe(400);
      expect(response2.body.message).toBe('Order items are required');
    });

     it('should handle database errors during order creation and return 500', async () => {
        // Use correct data structure
        const mockOrderData = { items: [{ product: 99, quantity: 1, unit_price: 10 }] }; 
        const dbError = new Error('DB insert failed');
        const expectedTotal = 10; // Calculated from mockOrderData

        // Mock DB responses for the transaction failure
        mockClient.query.mockResolvedValueOnce({}); // BEGIN
        mockClient.query.mockRejectedValueOnce(dbError); // Simulate failure on INSERT orders
        mockClient.query.mockResolvedValueOnce({}); // ROLLBACK

        // Add a mock token header with the correct payload key 'user_id'
        const mockToken = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET || 'test-secret');
        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${mockToken}`) // Add mock token
            .send(mockOrderData);

        expect(response.statusCode).toBe(500);
        // Expect the specific error message passed to next()
        expect(response.body.message).toBe('DB insert failed'); 
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        // Verify the INSERT attempt with the calculated total
        expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO orders'), [1, expectedTotal, 'Pending']); 
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK'); // Verify rollback was called
        expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // --- Test GET /api/orders ---
  describe('GET /api/orders', () => {
    it('should return orders for the authenticated user', async () => {
      const mockDbResponse = {
        rows: [
          { order_id: 1, status: 'Delivered', total_amount: '50.00', order_created_at: new Date(), item_id: 10, product_name: 'P1', quantity: 1, price_per_item: '50.00' },
          { order_id: 2, status: 'Pending', total_amount: '20.00', order_created_at: new Date(), item_id: 11, product_name: 'P2', quantity: 2, price_per_item: '10.00' },
        ]
      };
      db.query.mockResolvedValue(mockDbResponse); // Mock the main db query

      // Add a mock token header with the correct payload key 'user_id'
      const mockToken = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET || 'test-secret');
      const response = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${mockToken}`); // Add mock token

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].id).toBe(1);
      expect(response.body[0].items.length).toBe(1);
      expect(response.body[1].id).toBe(2);
      expect(response.body[1].items.length).toBe(1);
      // Check if the correct query was made for user ID 1 (mocked in middleware)
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE o.user_id = $1'), [1]);
    });

     it('should return an empty array if the user has no orders', async () => {
        db.query.mockResolvedValue({ rows: [] }); // No orders found

        // Add a mock token header with the correct payload key 'user_id'
        const mockToken = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET || 'test-secret');
        const response = await request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${mockToken}`); // Add mock token

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE o.user_id = $1'), [1]);
    });
  });

  // --- Test GET /api/orders/:id ---
  describe('GET /api/orders/:id', () => {
    it('should return a specific order for the authenticated user', async () => {
       const mockDbResponse = {
        rows: [
          { order_id: 5, status: 'Shipped', total_amount: '35.00', order_created_at: new Date(), item_id: 20, product_name: 'P3', quantity: 1, price_per_item: '15.00' },
          { order_id: 5, status: 'Shipped', total_amount: '35.00', order_created_at: new Date(), item_id: 21, product_name: 'P4', quantity: 2, price_per_item: '10.00' },
        ]
      };
      db.query.mockResolvedValue(mockDbResponse);

      // Add a mock token header with the correct payload key 'user_id'
      const mockToken = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET || 'test-secret');
      const response = await request(app)
          .get('/api/orders/5')
          .set('Authorization', `Bearer ${mockToken}`); // Add mock token

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(5);
      expect(response.body.items.length).toBe(2);
      expect(response.body.items[0].product_name).toBe('P3');
      expect(response.body.items[1].product_name).toBe('P4');
      // Check if the correct query was made for order ID 5 and user ID 1
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE o.id = $1 AND o.user_id = $2'), [5, 1]);
    });

    it('should return 404 if order not found or belongs to another user', async () => {
       db.query.mockResolvedValue({ rows: [] }); // Simulate order not found for this user

       // Add a mock token header with the correct payload key 'user_id'
       const mockToken = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET || 'test-secret');
       const response = await request(app)
           .get('/api/orders/999')
           .set('Authorization', `Bearer ${mockToken}`); // Add mock token

       expect(response.statusCode).toBe(404);
       expect(response.body.message).toBe('Order not found or access denied');
       expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE o.id = $1 AND o.user_id = $2'), [999, 1]);
    });

     it('should return 400 for invalid order ID format', async () => {
        // Add a mock token header with the correct payload key 'user_id'
        const mockToken = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET || 'test-secret');
        const response = await request(app)
            .get('/api/orders/invalid-id')
            .set('Authorization', `Bearer ${mockToken}`); // Add mock token
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Invalid order ID format');
    });
  });

}); // Close the main describe block for 'Order API Endpoints'
