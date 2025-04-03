const express = require('express');
const cors = require('cors'); // Import cors package
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 3001; // Use a different port than Django/React

// --- Middleware ---
// Enable CORS for all origins (adjust for production)
app.use(cors()); 
app.use(express.json()); // Parse JSON request bodies

// Basic route
app.get('/', (req, res) => {
  res.send('Order Service Running');
});

// --- API Routes ---
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');

app.use('/api/orders', orderRoutes);     // Mount order routes
app.use('/api/products', productRoutes); // Mount product routes
app.use('/api/customers', customerRoutes); // Mount customer routes


// --- Basic Error Handling Middleware ---
// This should be placed after all routes
app.use((err, req, res, next) => {
  console.error("Error:", err.stack || err.message || err); // Log the error details
  const statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
  const message = err.message || 'Something went wrong on the server';
  res.status(statusCode).json({ message });
});


app.listen(PORT, () => {
  console.log(`Order service listening on port ${PORT}`);
});

module.exports = app; // Export for testing
