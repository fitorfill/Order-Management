# Order Management API Routes Documentation

## Base URL

The base URL for all API endpoints is: `https://api.ordermanagement.com/v1`

## Authentication

All endpoints require authentication via an API key. Include the API key in the `Authorization` header as follows:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Orders

- `GET /orders`: Retrieve a list of orders.
- `POST /orders`: Create a new order.
- `GET /orders/{id}`: Retrieve a specific order by ID.
- `PUT /orders/{id}`: Update a specific order by ID.
- `DELETE /orders/{id}`: Delete a specific order by ID.

### Customers

- `GET /customers`: Retrieve a list of customers.
- `POST /customers`: Create a new customer.
- `GET /customers/{id}`: Retrieve a specific customer by ID.
- `PUT /customers/{id}`: Update a specific customer by ID.
- `DELETE /customers/{id}`: Delete a specific customer by ID.

### Products

- `GET /products`: Retrieve a list of products.
- `POST /products`: Create a new product.
- `GET /products/{id}`: Retrieve a specific product by ID.
- `PUT /products/{id}`: Update a specific product by ID.
- `DELETE /products/{id}`: Delete a specific product by ID.

### Inventory

- `GET /inventory`: Retrieve a list of inventory items.
- `POST /inventory`: Create a new inventory item.
- `GET /inventory/{id}`: Retrieve a specific inventory item by ID.
- `PUT /inventory/{id}`: Update a specific inventory item by ID.
- `DELETE /inventory/{id}`: Delete a specific inventory item by ID.

### Shipments

- `GET /shipments`: Retrieve a list of shipments.
- `POST /shipments`: Create a new shipment.
- `GET /shipments/{id}`: Retrieve a specific shipment by ID.
- `PUT /shipments/{id}`: Update a specific shipment by ID.
- `DELETE /shipments/{id}`: Delete a specific shipment by ID.

### Payments

- `GET /payments`: Retrieve a list of payments.
- `POST /payments`: Create a new payment.
- `GET /payments/{id}`: Retrieve a specific payment by ID.
- `PUT /payments/{id}`: Update a specific payment by ID.
- `DELETE /payments/{id}`: Delete a specific payment by ID.

### Returns

- `GET /returns`: Retrieve a list of returns.
- `POST /returns`: Create a new return.
- `GET /returns/{id}`: Retrieve a specific return by ID.
- `PUT /returns/{id}`: Update a specific return by ID.
- `DELETE /returns/{id}`: Delete a specific return by ID.
