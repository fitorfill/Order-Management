const db = require('../db');

// Controller to get all customers
const getAllCustomers = async (req, res, next) => {
  try {
    // Consider adding filtering or pagination if the customer list grows large
    const query = 'SELECT id, name, email, region FROM customers ORDER BY name ASC';
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    next(error); // Pass error to the error handling middleware
  }
};

// Add other controller functions if needed (getCustomerById, createCustomer, etc.)

module.exports = {
  getAllCustomers,
};

// Controller to create a new customer
const createCustomer = async (req, res, next) => {
  const { name, email, region } = req.body;

  // Basic validation
  if (!name) {
    return res.status(400).json({ message: 'Customer name is required.' });
  }
  // Optional: Add email format validation if email is provided

  try {
    const query = `
      INSERT INTO customers (name, email, region)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, region, created_at;
    `;
    // Use null for optional fields if they are not provided
    const result = await db.query(query, [name, email || null, region || null]);
    res.status(201).json(result.rows[0]); // Return the newly created customer
  } catch (error) {
    console.error('Error creating customer:', error);
     // Handle potential unique constraint violation for email if it's set to UNIQUE
    if (error.code === '23505' && error.constraint === 'customers_email_key') { // Adjust constraint name if needed
        return res.status(409).json({ message: `Customer with email '${email}' already exists.` });
    }
    next(error); // Pass other errors to the error handling middleware
  }
};

module.exports = {
  getAllCustomers,
  createCustomer, // Export the new function
};
