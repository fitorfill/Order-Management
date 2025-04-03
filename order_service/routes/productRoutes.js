const express = require('express');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all product routes
router.use(authMiddleware.verifyToken);

// Define product routes
router.get('/', productController.getAllProducts); // Get all products
router.post('/', productController.createProduct); // Create a new product
// Add more routes if needed (e.g., GET /:id, PUT /:id, DELETE /:id)

module.exports = router;
