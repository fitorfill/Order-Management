import React from 'react';
import { useOrders } from '../../context/OrderContext';
import '../../styles/OrderStyles.css';

const OrderHeader = () => {
  const { 
    filters, 
    sorting, 
    setFilter, 
    setSort,
    metrics,
    metricsLoading
  } = useOrders();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(name, value);
  };

  const handleSortClick = (field) => {
    setSort(field);
  };

  return (
    <div className="merchant-order-header">
      <div className="merchant-title-section">
        <span className="merchant-symbols">🐪</span>
        <h1>Silk Road Trading Ledger</h1>
        <span className="merchant-symbols">📜</span>
      </div>
      <p className="merchant-subtitle">
        Record and manage trade transactions across the ancient world
      </p>

      {!metricsLoading && metrics && (
        <div className="order-stats">
          <div className="stat-card total">
            <div className="stat-value">{metrics.total_orders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{metrics.pending_orders}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card processing">
            <div className="stat-value">{metrics.processing_orders}</div>
            <div className="stat-label">Processing</div>
          </div>
          <div className="stat-card shipped">
            <div className="stat-value">{metrics.shipped_orders}</div>
            <div className="stat-label">In Transit</div>
          </div>
          <div className="stat-card delivered">
            <div className="stat-value">{metrics.delivered_orders}</div>
            <div className="stat-label">Delivered</div>
          </div>
        </div>
      )}

      <div className="order-controls">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="merchant-search"
            placeholder="Search orders by number, customer or address..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ 
              target: { name: 'search', value: e.target.value } 
            })}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="merchant-select"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="payment-filter">Payment:</label>
            <select
              id="payment-filter"
              name="payment"
              value={filters.payment}
              onChange={handleFilterChange}
              className="merchant-select"
            >
              <option value="all">All Methods</option>
              <option value="GOLD">Gold Coins</option>
              <option value="SILVER">Silver Pieces</option>
              <option value="BARTER">Goods Exchange</option>
              <option value="CREDIT">Merchant Credit</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sort-controls">
        <span className="sort-label">Sort by:</span>
        <button
          className={`sort-button ${sorting.field === 'created_at' ? 'active' : ''}`}
          onClick={() => handleSortClick('created_at')}
        >
          Date {sorting.field === 'created_at' && 
            <span className="sort-direction">
              {sorting.direction === 'asc' ? '▲' : '▼'}
            </span>
          }
        </button>
        <button
          className={`sort-button ${sorting.field === 'order_number' ? 'active' : ''}`}
          onClick={() => handleSortClick('order_number')}
        >
          Order # {sorting.field === 'order_number' && 
            <span className="sort-direction">
              {sorting.direction === 'asc' ? '▲' : '▼'}
            </span>
          }
        </button>
        <button
          className={`sort-button ${sorting.field === 'customer_name' ? 'active' : ''}`}
          onClick={() => handleSortClick('customer_name')}
        >
          Customer {sorting.field === 'customer_name' && 
            <span className="sort-direction">
              {sorting.direction === 'asc' ? '▲' : '▼'}
            </span>
          }
        </button>
        <button
          className={`sort-button ${sorting.field === 'total' ? 'active' : ''}`}
          onClick={() => handleSortClick('total')}
        >
          Value {sorting.field === 'total' && 
            <span className="sort-direction">
              {sorting.direction === 'asc' ? '▲' : '▼'}
            </span>
          }
        </button>
      </div>
    </div>
  );
};

export default OrderHeader;
