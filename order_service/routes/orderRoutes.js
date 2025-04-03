const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware'); // We'll create this next

const router = express.Router();

// Apply authentication middleware to all order routes
router.use(authMiddleware.verifyToken);

// Define order routes
router.post('/', orderController.createOrder); // Create a new order
router.get('/', orderController.getUserOrders); // Get all orders for the logged-in user
router.get('/:id', orderController.getOrderById); // Get a specific order by ID
// router.put('/:id', orderController.updateOrder); // Optional: Update an order (e.g., status)
router.delete('/:id', orderController.deleteOrder); // Delete an order by ID

module.exports = router;
