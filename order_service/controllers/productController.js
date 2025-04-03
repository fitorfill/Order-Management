const db = require('../db');

// Controller to get all products
const getAllProducts = async (req, res, next) => {
  try {
    const query = 'SELECT id, name, description, price FROM products ORDER BY name ASC';
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    next(error); // Pass error to the error handling middleware
  }
};

// Add other controller functions if needed (getProductById, createProduct, etc.)

module.exports = {
  getAllProducts,
};

// Controller to create a new product
const createProduct = async (req, res, next) => {
  const { name, description, price } = req.body;

  // Basic validation
  if (!name || price === undefined || price === null) {
    return res.status(400).json({ message: 'Product name and price are required.' });
  }
  if (typeof price !== 'number' || price < 0) {
     return res.status(400).json({ message: 'Price must be a non-negative number.' });
  }

  try {
    const query = `
      INSERT INTO products (name, description, price)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, price, created_at;
    `;
    const result = await db.query(query, [name, description || null, price]); // Use null if description is empty
    res.status(201).json(result.rows[0]); // Return the newly created product
  } catch (error) {
    console.error('Error creating product:', error);
    // Handle potential unique constraint violation for name
    if (error.code === '23505') { // PostgreSQL unique violation error code
        return res.status(409).json({ message: `Product with name '${name}' already exists.` });
    }
    next(error); // Pass other errors to the error handling middleware
  }
};

module.exports = {
  getAllProducts,
  createProduct, // Export the new function
};
