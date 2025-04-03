const db = require('../db'); // Import the database query function

// Controller function to create a new order
const createOrder = async (req, res, next) => {
  // Extract order details (items, etc.) from req.body
  // Extract userId from req.userId (attached by authMiddleware)
  const { items } = req.body; // Assuming items is an array like [{ product_name, quantity, price_per_item }]
  const userId = req.userId;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order items are required' });
  }

  // TODO: Add validation for item properties (product_name, quantity, price_per_item)

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => {
    // Ensure quantity and unit_price are numbers
    const quantity = parseFloat(item.quantity);
    const price = parseFloat(item.unit_price); // Use unit_price here
    if (isNaN(quantity) || isNaN(price)) {
      // Handle error or skip item
      console.error("Invalid item data:", item);
      return sum; // Or throw an error
    }
    return sum + (quantity * price);
  }, 0);


  const client = await db.pool.connect(); // Get a client from the pool for transaction

  try {
    await client.query('BEGIN'); // Start transaction

    // Insert into orders table
    const orderQuery = `
      INSERT INTO orders (user_id, total_amount, status)
      VALUES ($1, $2, $3)
      RETURNING id, status, total_amount, created_at;
    `;
    const orderResult = await client.query(orderQuery, [userId, totalAmount, 'Pending']);
    const newOrderId = orderResult.rows[0].id;

    // Prepare to insert items - fetch product names first if needed
    const itemInsertPromises = items.map(async (item) => {
      // --- Adjust keys based on frontend data ---
      const productId = item.product; // Assuming 'product' holds the ID
      const quantity = parseInt(item.quantity, 10);
      const price = parseFloat(item.unit_price); // Assuming 'unit_price' holds the price

      if (productId === undefined || isNaN(quantity) || isNaN(price)) {
        console.error("Invalid item structure received:", item);
        throw new Error(`Invalid data structure for item.`);
      }

      // --- Fetch product name using productId ---
      // NOTE: This adds extra DB queries within the transaction. Consider alternatives
      // if performance is critical (e.g., sending name from frontend, joining later).
      let productName = 'Unknown Product'; // Default
      try {
        const productResult = await client.query('SELECT name FROM products WHERE id = $1', [productId]);
        if (productResult.rows.length > 0) {
          productName = productResult.rows[0].name;
        } else {
           console.warn(`Product with ID ${productId} not found.`);
           // Decide how to handle: throw error, use default, etc.
           // For now, we'll proceed with 'Unknown Product' but log a warning.
        }
      } catch (productError) {
         console.error(`Error fetching product name for ID ${productId}:`, productError);
         // Decide how to handle: throw error, use default, etc.
         throw new Error(`Failed to retrieve product details for ID ${productId}.`);
      }


      // --- Insert into order_items table ---
      const itemQuery = `
        INSERT INTO order_items (order_id, product_name, quantity, price_per_item)
        VALUES ($1, $2, $3, $4);
      `;
      return client.query(itemQuery, [newOrderId, productName, quantity, price]);
    });

    await Promise.all(itemInsertPromises); // Execute all item insertions (now includes product lookup)

    await client.query('COMMIT'); // Commit transaction

    res.status(201).json({
        message: 'Order created successfully',
        order: {
            id: newOrderId,
            ...orderResult.rows[0],
            items: items // Include items in response for clarity
        }
     });

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error('Error creating order:', error);
    // Pass error to a dedicated error handling middleware (to be added later)
    next(error); // Forward error
  } finally {
    client.release(); // Release client back to the pool
  }
};

// Controller function to get all orders for the logged-in user
const getUserOrders = async (req, res, next) => {
  const userId = req.userId;

  try {
    // Query to get orders and their items
    // Using a JOIN or separate queries depending on preference/performance needs
    // Example using JOIN:
    const query = `
        SELECT
            o.id AS order_id,
            o.status,
            o.total_amount,
            o.created_at AS order_created_at,
            oi.id AS item_id,
            oi.product_name,
            oi.quantity,
            oi.price_per_item
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC, oi.id ASC;
    `;
    const result = await db.query(query, [userId]);

    // Process the results to group items by order
    const ordersMap = new Map();
    result.rows.forEach(row => {
        if (!ordersMap.has(row.order_id)) {
            ordersMap.set(row.order_id, {
                id: row.order_id,
                status: row.status,
                total_amount: row.total_amount,
                created_at: row.order_created_at,
                items: []
            });
        }
        if (row.item_id) { // Check if there are items (LEFT JOIN might return nulls for orders with no items)
             ordersMap.get(row.order_id).items.push({
                id: row.item_id,
                product_name: row.product_name,
                quantity: row.quantity,
                price_per_item: row.price_per_item
            });
        }
    });

    const orders = Array.from(ordersMap.values());

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    next(error);
  }
};

// Controller function to get a specific order by ID
const getOrderById = async (req, res, next) => {
  const userId = req.userId;
  const orderId = parseInt(req.params.id, 10);

   if (isNaN(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID format' });
    }

  try {
     const query = `
        SELECT
            o.id AS order_id,
            o.status,
            o.total_amount,
            o.created_at AS order_created_at,
            oi.id AS item_id,
            oi.product_name,
            oi.quantity,
            oi.price_per_item
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1 AND o.user_id = $2 -- Ensure user owns the order
        ORDER BY oi.id ASC;
    `;
    const result = await db.query(query, [orderId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found or access denied' });
    }

    // Process the results
    const order = {
        id: result.rows[0].order_id,
        status: result.rows[0].status,
        total_amount: result.rows[0].total_amount,
        created_at: result.rows[0].order_created_at,
        items: []
    };

    result.rows.forEach(row => {
         if (row.item_id) {
             order.items.push({
                id: row.item_id,
                product_name: row.product_name,
                quantity: row.quantity,
                price_per_item: row.price_per_item
            });
         }
    });


    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    next(error);
  }
};

// Placeholder for updateOrder (Optional)
// const updateOrder = async (req, res, next) => {
//   // Implementation needed
//   res.status(501).json({ message: 'Not Implemented' });
// };

// Placeholder for deleteOrder (Optional)
// const deleteOrder = async (req, res, next) => {
//   // Implementation needed
//   res.status(501).json({ message: 'Not Implemented' });
// };

// Controller function to delete an order by ID
const deleteOrder = async (req, res, next) => {
  const userId = req.userId;
  const orderId = parseInt(req.params.id, 10);

  if (isNaN(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID format' });
  }

  try {
    // Ensure the user owns the order before deleting
    const deleteQuery = `
      DELETE FROM orders
      WHERE id = $1 AND user_id = $2
      RETURNING id; -- Return the ID if deletion was successful
    `;
    const result = await db.query(deleteQuery, [orderId, userId]);

    if (result.rowCount === 0) {
      // Either order didn't exist or user didn't own it
      return res.status(404).json({ message: 'Order not found or access denied' });
    }

    // Deletion successful (ON DELETE CASCADE should handle order_items)
    res.status(204).send(); // 204 No Content is standard for successful DELETE

  } catch (error) {
    console.error('Error deleting order:', error);
    next(error);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  // updateOrder,
  deleteOrder, // Export the new function
};
