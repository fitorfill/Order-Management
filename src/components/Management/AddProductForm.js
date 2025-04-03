import React, { useState } from 'react';
import { useOrders } from '../../context/OrderContext'; // Assuming addProduct is in OrderContext
import { useNavigate } from 'react-router-dom';
// import './ManagementStyles.css'; // Optional: Create and import styles

const AddProductForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addProduct } = useOrders(); // Get the addProduct function from context
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      setError('Price must be a valid non-negative number.');
      setLoading(false);
      return;
    }

    try {
      await addProduct({ name, description, price: priceNumber });
      // Optionally navigate away after success, e.g., back to dashboard or a product list page
      navigate('/orders'); // Navigate back to orders dashboard for now
    } catch (err) {
      console.error("Failed to add product:", err);
      setError(err.message || 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="management-form-container"> {/* Use a consistent container class */}
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-field">
          <label htmlFor="product-name">Product Name:</label>
          <input
            type="text"
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="merchant-input" // Re-use existing styles if applicable
          />
        </div>
        <div className="form-field">
          <label htmlFor="product-description">Description:</label>
          <textarea
            id="product-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="merchant-textarea" // Re-use existing styles
          />
        </div>
        <div className="form-field">
          <label htmlFor="product-price">Price:</label>
          <input
            type="number"
            id="product-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            step="0.01"
            min="0"
            className="merchant-input"
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading} className="merchant-button primary">
            {loading ? 'Adding...' : 'Add Product'}
          </button>
           <button type="button" onClick={() => navigate(-1)} className="merchant-button cancel">
             Cancel
           </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductForm;
