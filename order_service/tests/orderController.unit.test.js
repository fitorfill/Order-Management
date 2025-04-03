// Correctly import getUserOrders
const { getUserOrders, getOrderById, createOrder } = require('../controllers/orderController');
const db = require('../db'); // Import the db module to mock

// --- Mocking ---
// Mock the entire db module
jest.mock('../db', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
  },
}));

// Helper function to create mock req, res, next objects
const getMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res); // For potential error responses without json
  return res;
};

const getMockReq = (params = {}, body = {}, userId = 1) => ({
  params,
  body,
  userId, // Add mock userId, assuming auth middleware sets this
});

const mockNext = jest.fn();

// --- Test Suite ---
describe('Order Controller - Unit Tests', () => {

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // DO NOT connect client here, do it in specific describe blocks if needed
  });

  // --- Tests for getUserOrders --- Corrected describe block name
  describe('getUserOrders', () => { 
    it('should fetch orders successfully and return 200', async () => {
      const mockReq = getMockReq();
      const mockRes = getMockRes();
      const mockOrdersData = [
        { order_id: 1, status: 'Delivered', total_amount: '50.00', order_created_at: new Date(), item_id: 10, product_name: 'P1', quantity: 1, price_per_item: '50.00' },
        { order_id: 2, status: 'Pending', total_amount: '20.00', order_created_at: new Date(), item_id: 11, product_name: 'P2', quantity: 2, price_per_item: '10.00' },
      ];
      // Mock the db.query function for this specific test
      db.query.mockResolvedValueOnce({ rows: mockOrdersData });

      await getUserOrders(mockReq, mockRes, mockNext); // Use correct function name

      // Check database query call - Verify it was called with *a* string and the correct userId
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [mockReq.userId]); 

      // Check response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      const responseJson = mockRes.json.mock.calls[0][0];
      expect(responseJson).toHaveLength(2); // Check if orders are grouped correctly
      expect(responseJson[0].id).toBe(1);
      expect(responseJson[0].items).toHaveLength(1);
      expect(responseJson[1].id).toBe(2);
      expect(responseJson[1].items).toHaveLength(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 200 with an empty array if no orders found', async () => {
        const mockReq = getMockReq();
        const mockRes = getMockRes();
        db.query.mockResolvedValueOnce({ rows: [] }); // Mock empty result

        await getUserOrders(mockReq, mockRes, mockNext); // Use correct function name

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith([]);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if database query fails', async () => {
      const mockReq = getMockReq();
      const mockRes = getMockRes();
      const dbError = new Error('Database connection failed');
      db.query.mockRejectedValueOnce(dbError); // Mock query failure

      await getUserOrders(mockReq, mockRes, mockNext); // Use correct function name

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      // Ensure the correct error object is passed
      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  // --- Tests for getOrderById ---
  describe('getOrderById', () => {
    it('should return 400 if order ID is not a number', async () => {
      const mockReq = getMockReq({ id: 'invalid-id' }); // Invalid ID
      const mockRes = getMockRes();

      await getOrderById(mockReq, mockRes, mockNext);

      expect(db.query).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid order ID format' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fetch a specific order successfully and return 200', async () => {
      const mockReq = getMockReq({ id: '5' }); // Valid ID as string param
      const mockRes = getMockRes();
      // Define mock data specifically for this test, ensuring order_id is 5
      const mockSpecificOrderData = [
        { order_id: 5, status: 'Shipped', total_amount: '35.00', order_created_at: new Date(), item_id: 20, product_name: 'P3', quantity: 1, price_per_item: '15.00' },
        { order_id: 5, status: 'Shipped', total_amount: '35.00', order_created_at: new Date(), item_id: 21, product_name: 'P4', quantity: 2, price_per_item: '10.00' },
      ];
      // Ensure this mock applies only here
      db.query.mockResolvedValueOnce({ rows: mockSpecificOrderData });

      await getOrderById(mockReq, mockRes, mockNext);

      // Check database query call
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE o.id = $1 AND o.user_id = $2'), [5, mockReq.userId]); // Check query, order ID (parsed), and user ID

      // Check response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      const responseJson = mockRes.json.mock.calls[0][0];
      expect(responseJson.id).toBe(5);
      expect(responseJson.items).toHaveLength(2);
      expect(responseJson.items[0].product_name).toBe('P3');
      expect(responseJson.items[1].product_name).toBe('P4');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if order not found', async () => {
      const mockReq = getMockReq({ id: '999' });
      const mockRes = getMockRes();
      db.query.mockResolvedValueOnce({ rows: [] }); // Mock empty result

      await getOrderById(mockReq, mockRes, mockNext);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE o.id = $1 AND o.user_id = $2'), [999, mockReq.userId]);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Order not found or access denied' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if database query fails', async () => {
      const mockReq = getMockReq({ id: '5' });
      const mockRes = getMockRes();
      // Use a distinct error object for this test
      const specificDbError = new Error('DB query failed for getOrderById'); 
      db.query.mockRejectedValueOnce(specificDbError); // Mock query failure

      await getOrderById(mockReq, mockRes, mockNext);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      // Ensure the correct error object is passed
      expect(mockNext).toHaveBeenCalledWith(specificDbError); 
    });
  });

  // --- Tests for createOrder ---
  describe('createOrder', () => {
    // No beforeEach needed here for connect, setup client inside tests that need it

    it('should create an order successfully and return 201', async () => {
      // Setup mock client for this specific test
      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.pool.connect.mockResolvedValueOnce(mockClient); 

      const mockReq = getMockReq({}, {
        items: [
          { product: 1, quantity: 2, unit_price: 10.50 },
          { product: 2, quantity: 1, unit_price: 5.00 }
        ]
      });
      const mockRes = getMockRes();
      const expectedTotal = (2 * 10.50) + (1 * 5.00); // 26.00
      const mockOrderResult = { id: 101, status: 'Pending', total_amount: expectedTotal.toString(), created_at: new Date() };

      // Mock transaction flow
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrderResult] }) // INSERT orders
        .mockResolvedValueOnce({ rows: [{ name: 'Product A' }] }) // SELECT product name (ID 1)
        .mockResolvedValueOnce({ rows: [{ name: 'Product B' }] }) // SELECT product name (ID 2)
        .mockResolvedValueOnce({}) // INSERT order_items (item 1)
        .mockResolvedValueOnce({}) // INSERT order_items (item 2)
        .mockResolvedValueOnce({}); // COMMIT

      await createOrder(mockReq, mockRes, mockNext);

      // Check response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      const responseJson = mockRes.json.mock.calls[0][0];
      expect(responseJson.message).toBe('Order created successfully');
      expect(responseJson.order.id).toBe(101);
      expect(responseJson.order.items).toEqual(mockReq.body.items); // Controller returns original items

      // Check transaction calls
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO orders'), [mockReq.userId, expectedTotal, 'Pending']);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT name FROM products WHERE id = $1', [1]);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT name FROM products WHERE id = $1', [2]);
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO order_items'), [101, 'Product A', 2, 10.50]);
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO order_items'), [101, 'Product B', 1, 5.00]);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if items array is missing', async () => {
      const mockReq = getMockReq({}, {}); // No items in body
      const mockRes = getMockRes();

      await createOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Order items are required' });
      // Connect should definitely not be called here
      expect(db.pool.connect).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

     it('should return 400 if items array is empty', async () => {
      const mockReq = getMockReq({}, { items: [] }); // Empty items array
      const mockRes = getMockRes();

      await createOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Order items are required' });
      // Connect should definitely not be called here
      expect(db.pool.connect).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error and rollback if database query fails during transaction', async () => {
      const mockReq = getMockReq({}, {
        items: [{ product: 1, quantity: 1, unit_price: 10.00 }]
      });
      const mockRes = getMockRes();
      // Setup mock client for this specific test
      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.pool.connect.mockResolvedValueOnce(mockClient);

      const dbError = new Error('Insert failed');
      const expectedTotal = 10.00;

      // Mock transaction flow with failure
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(dbError); // Fail on INSERT orders
      // Mock ROLLBACK (assuming it's called in the catch block)
      mockClient.query.mockResolvedValueOnce({}); // Mock ROLLBACK success 

      await createOrder(mockReq, mockRes, mockNext);

      // Check transaction calls
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO orders'), [mockReq.userId, expectedTotal, 'Pending']);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK'); // Verify rollback
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      // Check error handling
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

     it('should call next with error and rollback if product lookup fails during transaction', async () => {
      const mockReq = getMockReq({}, {
        items: [{ product: 1, quantity: 1, unit_price: 10.00 }]
      });
      const mockRes = getMockRes();
      // Setup mock client for this specific test
      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.pool.connect.mockResolvedValueOnce(mockClient);

      const productLookupError = new Error('Product lookup failed'); // Use distinct error
      const expectedTotal = 10.00;
      const mockOrderResult = { id: 102, status: 'Pending', total_amount: expectedTotal.toString(), created_at: new Date() };


      // Mock transaction flow with failure during product lookup
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrderResult] }) // INSERT orders (success)
        .mockRejectedValueOnce(productLookupError); // Fail on SELECT product name
      // Mock ROLLBACK
      mockClient.query.mockResolvedValueOnce({}); // Mock ROLLBACK success

      await createOrder(mockReq, mockRes, mockNext);

      // Check transaction calls
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO orders'), [mockReq.userId, expectedTotal, 'Pending']);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT name FROM products WHERE id = $1', [1]); // Attempt product lookup
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK'); // Verify rollback
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      // Check error handling
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      // The error passed to next might be wrapped by the controller logic
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error)); 
      // More specific check if the controller wraps the error predictably:
      // expect(mockNext).toHaveBeenCalledWith(new Error('Failed to retrieve product details for ID 1.'));
    });
  });

});
