import React from 'react';
import { useOrders } from '../../context/OrderContext';
import OrderCard from './OrderCard';
import '../../styles/OrderStyles.css';

const OrderList = () => {
  const { 
    filteredSortedOrders, 
    loading, 
    error, 
    deleteOrder, 
    updateOrder
  } = useOrders();

  const handleEdit = async (order) => {
    // This would typically open a modal or navigate to an edit page
    // For now, just implement a simple status change on edit
    try {
      const newStatus = window.prompt(
        `Update status for order ${order.order_number}`, 
        order.status
      );
      
      if (newStatus && newStatus !== order.status) {
        await updateOrder(order.id, { status: newStatus });
      }
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order. Please try again.');
    }
  };

  const handleDelete = async (orderId) => {
    try {
      await deleteOrder(orderId);
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="merchant-loading">
        <div className="loading-symbol">🧭</div>
        <p>Retrieving trade records from distant caravans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="merchant-error">
        <div className="error-symbol">⚠️</div>
        <h3>Trade Routes Disrupted</h3>
        <p>{error || 'Failed to fetch orders. Please try again.'}</p>
      </div>
    );
  }

  if (filteredSortedOrders.length === 0) {
    return (
      <div className="merchant-empty">
        <div className="empty-symbol">📜</div>
        <h3>No Trade Records Found</h3>
        <p>Your ledger is empty. Create a new trade record to begin tracking your business.</p>
      </div>
    );
  }

  return (
    <div className="merchant-order-list">
      {filteredSortedOrders.map((order) => (
        <OrderCard 
          key={order.id} 
          order={order} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default OrderList;
