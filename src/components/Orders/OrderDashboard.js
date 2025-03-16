import React from 'react';
import { OrderProvider } from '../../context/OrderContext';
import OrderHeader from './OrderHeader';
import OrderList from './OrderList';
import NewOrderForm from './NewOrderForm';
import '../../styles/OrderStyles.css';

const OrderDashboard = () => {
  return (
    <OrderProvider>
      <div className="merchant-dashboard">
        <div className="merchant-column-decorations">
          <div className="column"></div>
          <span className="symbol">🐪</span>
          <div className="column"></div>
          <span className="symbol">🧾</span>
          <div className="column"></div>
          <span className="symbol">🔔</span>
          <div className="column"></div>
          <span className="symbol">💰</span>
          <div className="column"></div>
        </div>
        
        <div className="merchant-content">
          <OrderHeader />
          <NewOrderForm />
          <OrderList />
        </div>
      </div>
    </OrderProvider>
  );
};

export default OrderDashboard;
