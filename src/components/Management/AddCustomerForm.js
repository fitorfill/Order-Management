import React, { useState } from 'react';
import { useOrders } from '../../context/OrderContext'; // Assuming addCustomer is in OrderContext
import { useNavigate } from 'react-router-dom';
// import './ManagementStyles.css'; // Optional: Create and import styles

const AddCustomerForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addCustomer } = useOrders(); // Get the addCustomer function from context
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name.trim()) {
        setError('Customer name is required.');
        setLoading(false);
        return;
    }

    try {
      await addCustomer({ name, email, region });
      // Optionally navigate away after success
      navigate('/orders'); // Navigate back to orders dashboard for now
    } catch (err) {
      console.error("Failed to add customer:", err);
      setError(err.message || 'Failed to add customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="management-form-container"> {/* Use a consistent container class */}
      <h2>Add New Customer</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-field">
          <label htmlFor="customer-name">Customer Name:</label>
          <input
            type="text"
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="merchant-input" // Re-use existing styles if applicable
          />
        </div>
        <div className="form-field">
          <label htmlFor="customer-email">Email (Optional):</label>
          <input
            type="email"
            id="customer-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="merchant-input"
          />
        </div>
        <div className="form-field">
          <label htmlFor="customer-region">Region (Optional):</label>
          <input
            type="text"
            id="customer-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="merchant-input"
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading} className="merchant-button primary">
            {loading ? 'Adding...' : 'Add Customer'}
          </button>
           <button type="button" onClick={() => navigate(-1)} className="merchant-button cancel">
             Cancel
           </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomerForm;
