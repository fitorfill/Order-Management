import React, { useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import '../../styles/OrderStyles.css';

const initialOrderState = {
  customer: '',
  items: [],
  payment_method: 'GOLD',
  shipping_address: '',
  notes: '',
  status: 'PENDING'
};

const initialItemState = {
  product: '',
  quantity: 1,
  unit_price: 0
};

const NewOrderForm = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newOrder, setNewOrder] = useState(initialOrderState);
  const [currentItem, setCurrentItem] = useState(initialItemState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { addOrder, customers, products } = useOrders();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewOrder({ ...newOrder, [name]: value });
  };
  
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'product') {
      const selectedProduct = products.find(p => p.id === parseInt(value));
      if (selectedProduct) {
        setCurrentItem({
          ...currentItem,
          product: parseInt(value),
          unit_price: selectedProduct.price
        });
      } else {
        setCurrentItem({
          ...currentItem,
          product: parseInt(value)
        });
      }
    } else if (name === 'quantity') {
      const quantity = parseInt(value) || 1;
      setCurrentItem({
        ...currentItem,
        quantity: quantity
      });
    } else if (name === 'unit_price') {
      const price = parseFloat(value) || 0;
      setCurrentItem({
        ...currentItem,
        unit_price: price
      });
    } else {
      setCurrentItem({
        ...currentItem,
        [name]: value
      });
    }
  };
  
  const addItemToOrder = () => {
    if (!currentItem.product) {
      setError('Please select a product');
      return;
    }
    
    if (currentItem.quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    
    const selectedProduct = products.find(p => p.id === currentItem.product);
    const newItem = {
      ...currentItem,
      product_name: selectedProduct.name,
      product_origin: selectedProduct.origin,
      total_price: currentItem.unit_price * currentItem.quantity
    };
    
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, newItem]
    });
    
    setCurrentItem(initialItemState);
    setError('');
  };
  
  const removeItemFromOrder = (index) => {
    const updatedItems = [...newOrder.items];
    updatedItems.splice(index, 1);
    setNewOrder({
      ...newOrder,
      items: updatedItems
    });
  };
  
  const calculateTotal = () => {
    return newOrder.items.reduce((total, item) => total + item.total_price, 0);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Form validation
      if (!newOrder.customer) {
        throw new Error('Please select a customer');
      }
      
      if (newOrder.items.length === 0) {
        throw new Error('Please add at least one item to the order');
      }
      
      if (!newOrder.shipping_address.trim()) {
        throw new Error('Shipping address is required');
      }
      
      // Format data for API
      const formattedOrder = {
        customer: parseInt(newOrder.customer),
        payment_method: newOrder.payment_method,
        shipping_address: newOrder.shipping_address.trim(),
        notes: newOrder.notes.trim(),
        status: newOrder.status,
        items: newOrder.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };
      
      // Submit order
      await addOrder(formattedOrder);
      
      // Reset form
      setNewOrder(initialOrderState);
      setIsExpanded(false);
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (typeof error === 'object' && error !== null) {
        if (error.detail) {
          setError(error.detail);
        } else if (error.message) {
          setError(error.message);
        } else {
          setError('Failed to create order. Please check your input.');
        }
      } else {
        setError('Failed to create order. Please check your input.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="new-order-container">
      {!isExpanded ? (
        <button 
          className="merchant-button primary new-order-trigger" 
          onClick={() => setIsExpanded(true)}
        >
          <span className="add-icon">+</span>
          <span className="add-text">Record New Trade</span>
        </button>
      ) : (
        <div className="new-order-form-wrapper merchant-card">
          <h3 className="form-title">
            <span className="form-icon">🧾</span>
            New Silk Road Trade Document
          </h3>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="merchant-form">
            <div className="form-section">
              <h4>Customer Information</h4>
              <div className="form-field">
                <label htmlFor="customer">Merchant:</label>
                <select
                  id="customer"
                  name="customer"
                  value={newOrder.customer}
                  onChange={handleChange}
                  className="merchant-select"
                  required
                >
                  <option value="">-- Select Merchant --</option>
                  {customers && customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.region})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-field">
                <label htmlFor="shipping_address">Shipping Destination:</label>
                <textarea
                  id="shipping_address"
                  name="shipping_address"
                  value={newOrder.shipping_address}
                  onChange={handleChange}
                  className="merchant-textarea"
                  placeholder="Enter caravan destination details"
                  rows={2}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="payment_method">Payment Method:</label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    value={newOrder.payment_method}
                    onChange={handleChange}
                    className="merchant-select"
                  >
                    <option value="GOLD">Gold Coins</option>
                    <option value="SILVER">Silver Pieces</option>
                    <option value="BARTER">Goods Exchange</option>
                    <option value="CREDIT">Merchant Credit</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label htmlFor="status">Status:</label>
                  <select
                    id="status"
                    name="status"
                    value={newOrder.status}
                    onChange={handleChange}
                    className="merchant-select"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4>Order Items</h4>
              <div className="add-item-container">
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="product">Product:</label>
                    <select
                      id="product"
                      name="product"
                      value={currentItem.product}
                      onChange={handleItemChange}
                      className="merchant-select"
                    >
                      <option value="">-- Select Product --</option>
                      {products && products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.origin} ({product.stock} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="quantity">Quantity:</label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={handleItemChange}
                      className="merchant-input"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="unit_price">Unit Price:</label>
                    <input
                      id="unit_price"
                      name="unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.unit_price}
                      onChange={handleItemChange}
                      className="merchant-input"
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={addItemToOrder}
                  className="merchant-button secondary"
                >
                  Add Item
                </button>
              </div>
              
              {newOrder.items.length > 0 && (
                <div className="items-list">
                  <h5>Items in this order:</h5>
                  <table className="merchant-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Origin</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.product_name}</td>
                          <td>{item.product_origin}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unit_price} gold</td>
                          <td>{item.total_price} gold</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeItemFromOrder(index)}
                              className="merchant-button cancel small"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td colSpan="4" className="total-label">Order Total:</td>
                        <td colSpan="2" className="total-value">{calculateTotal()} gold</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="notes">Additional Notes:</label>
              <textarea
                id="notes"
                name="notes"
                value={newOrder.notes}
                onChange={handleChange}
                className="merchant-textarea"
                placeholder="Any special instructions or notes about this trade"
                rows={3}
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="merchant-button primary" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording Trade...' : 'Complete Trade'}
              </button>
              <button 
                type="button" 
                className="merchant-button cancel"
                onClick={() => setIsExpanded(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NewOrderForm;
