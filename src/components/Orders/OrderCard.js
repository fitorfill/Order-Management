import React, { useState } from 'react';
import '../../styles/OrderStyles.css';

const OrderCard = ({ order, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get appropriate status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING': return '⏳';
      case 'PROCESSING': return '🔨';
      case 'SHIPPED': return '🐪';  // Camel for caravan shipping
      case 'DELIVERED': return '📦';
      case 'CANCELLED': return '❌';
      default: return '❓';
    }
  };
  
  // Get appropriate payment method icon
  const getPaymentIcon = (method) => {
    switch(method) {
      case 'GOLD': return '🪙';
      case 'SILVER': return '💰';
      case 'BARTER': return '🔄';
      case 'CREDIT': return '📜';  // Scroll for credit document
      default: return '❓';
    }
  };
  
  return (
    <div className={`merchant-order-card status-${order.status.toLowerCase()}`}>
      <div className="merchant-card-header">
        <h3 className="order-number">{order.order_number}</h3>
        <div className="order-status-badge">
          <span className="status-icon">{getStatusIcon(order.status)}</span>
          <span>{order.status_display || order.status}</span>
        </div>
      </div>
      
      <div className="merchant-card-body">
        <div className="order-customer">
          <strong>Merchant:</strong> {order.customer_name}
          {order.customer_region && <span className="customer-region"> ({order.customer_region})</span>}
        </div>
        
        <div className="order-meta">
          <div className="order-date">
            <span className="meta-label">Created:</span> {formatDate(order.created_at)}
          </div>
          <div className="order-payment">
            <span className="meta-label">Payment:</span> {getPaymentIcon(order.payment_method)} {order.payment_method_display || order.payment_method}
          </div>
        </div>
        
        <div className="order-summary">
          <div className="summary-item">
            <span className="summary-label">Items:</span> 
            <span className="summary-value">{order.items_count}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total:</span> 
            <span className="summary-value total">{order.total} gold pieces</span>
          </div>
        </div>
        
        <div className="order-expand-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide Details ▲' : 'Show Details ▼'}
        </div>
        
        {expanded && (
          <div className="order-details">
            <div className="order-address">
              <h4>Shipping Location:</h4>
              <p>{order.shipping_address}</p>
            </div>
            
            {order.notes && (
              <div className="order-notes">
                <h4>Notes:</h4>
                <p>{order.notes}</p>
              </div>
            )}
            
            <div className="order-items">
              <h4>Items:</h4>
              <table className="merchant-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Origin</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.product_origin}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit_price} gold</td>
                      <td>{item.total_price} gold</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="merchant-card-actions">
        <button 
          className="merchant-button secondary"
          onClick={() => onEdit(order)}
        >
          Edit Order
        </button>
        <button 
          className="merchant-button cancel"
          onClick={() => window.confirm('Are you sure you want to delete this order?') && onDelete(order.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
