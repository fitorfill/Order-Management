const express = require('express');
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all customer routes
router.use(authMiddleware.verifyToken);

// Define customer routes
router.get('/', customerController.getAllCustomers); // Get all customers
router.post('/', customerController.createCustomer); // Create a new customer
// Add more routes if needed (e.g., GET /:id, PUT /:id, DELETE /:id)

module.exports = router;
