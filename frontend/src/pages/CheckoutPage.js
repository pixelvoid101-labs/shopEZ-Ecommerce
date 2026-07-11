import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { authUser, token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Form State Properties aligned to map correctly to nested schema paths
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '', phone: '', streetAddress: '', city: '', state: '', pincode: '', country: 'India'
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const userEmail = authUser && (authUser.id || authUser.email) ? (authUser.id || authUser.email) : 'guest';
  const cartKey = `shopez-cart-${userEmail}`;

  useEffect(() => {
    setCartItems(JSON.parse(localStorage.getItem(cartKey) || '[]'));
  }, [cartKey]);

  // Sync state mutations to local storage and dispatch standard storage event
  const saveCart = (updatedItems) => {
    setCartItems(updatedItems);
    localStorage.setItem(cartKey, JSON.stringify(updatedItems));
    window.dispatchEvent(new Event('storage'));
  };

  const updateQuantity = (id, amount) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    saveCart(updated);
  };

  const removeItem = (id) => {
    const updated = cartItems.filter(item => item.id !== id);
    saveCart(updated);
  };

  const totalItemsCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const priceBreakdown = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const itemOriginal = item.originalPrice || item.price; 
      acc.originalTotal += itemOriginal * item.quantity;
      acc.discountTotal += (itemOriginal - item.price) * item.quantity;
      acc.finalAmount += item.price * item.quantity;
      return acc;
    }, { originalTotal: 0, discountTotal: 0, finalAmount: 0 });
  }, [cartItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  // INTEGRATED RE-ENGINEERED PIPELINE PROCESSOR
  const handleFinalOrderSubmit = async (e) => {
    e.preventDefault();
    if (!authUser) { navigate('/login'); return; }
    
    setLoading(true);
    try {
      // FIX 1: Safe fallback to localStorage if AuthContext token is temporarily uninitialized
      const activeToken = token || localStorage.getItem('token');

      if (!activeToken || activeToken === 'undefined' || activeToken === 'null') {
        alert('Your login session has expired. Please log in again.');
        navigate('/login');
        return;
      }

      // FIX 2: Clean up token by removing surrounding quotes or duplicate Bearer prefixes
      const cleanToken = activeToken.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '');

      const payload = {
        items: cartItems.map((item) => ({
          product: item.id || item._id, // Support both formatting schemas safely
          quantity: Number(item.quantity),
          price: Number(item.price), // Force raw numbers, eliminating potential string-casing bugs
        })),
        totalAmount: Number(priceBreakdown.finalAmount),
        shippingAddress: {
          fullName: shippingAddress.fullName.trim(),
          phone: shippingAddress.phone.trim(),
          address: shippingAddress.streetAddress.trim(), // maps form's streetAddress to schema backend field
          city: shippingAddress.city.trim(),
          state: shippingAddress.state.trim(),
          pincode: shippingAddress.pincode.trim(),
          country: shippingAddress.country || 'India'
        },
        paymentMethod: paymentMethod || 'COD',
        status: 'Pending'
      };

      await axios.post('http://localhost:5000/api/orders', payload, {
        headers: { 
          // NOTE: If this still throws 401, change `Bearer ${cleanToken}` to just `cleanToken`
          Authorization: `Bearer ${cleanToken}` 
        }
      });

      localStorage.removeItem(cartKey);
      setCartItems([]);
      window.dispatchEvent(new Event('storage'));
      navigate('/orders');
    } catch (error) {
      console.error('Order pipeline failed', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row g-4">
        
        {/* Dynamic Left Column: Cart Summary OR Shipping Input Sheet Form */}
        <div className="col-md-7">
          {!showOrderForm ? (
            <div className="card p-4 shadow-sm border-0 rounded-3">
              <h3 className="fw-bold">Secure Checkout</h3>
              <p className="text-muted">Review your cart and confirm the order summary.</p>
              {cartItems.length === 0 ? (
                <p className="text-muted">Your cart is empty.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {cartItems.map((item, index) => (
                    <div className="p-3 border rounded d-flex justify-content-between align-items-center bg-white shadow-sm mb-2" key={index}>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">{item.title}</h6>
                        <small className="text-muted d-block mb-3">₹{item.price.toFixed(2)} x {item.quantity}</small>
                        
                        {/* Beautifully Finished Pill Selector Block */}
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-flex align-items-center border border-secondary rounded-pill p-1 bg-light shadow-sm" style={{ width: '130px' }}>
                            <button 
                              type="button" 
                              className="btn btn-sm bg-white rounded-circle fw-bold border-0 text-dark d-flex align-items-center justify-content-center p-0" 
                              style={{ width: '28px', height: '28px', transition: 'all 0.2s', fontSize: '16px' }}
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              &minus;
                            </button>
                            <span className="fw-bold text-dark text-center flex-grow-1 small">{item.quantity}</span>
                            <button 
                              type="button" 
                              className="btn btn-sm bg-white rounded-circle fw-bold border-0 text-dark d-flex align-items-center justify-content-center p-0" 
                              style={{ width: '28px', height: '28px', transition: 'all 0.2s', fontSize: '16px' }}
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                          
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2 ms-1 d-flex align-items-center justify-content-center" 
                            style={{ width: '34px', height: '34px' }} 
                            onClick={() => removeItem(item.id)}
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <span className="fw-bold text-dark fs-5">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card p-4 shadow-sm border-0 rounded-3">
              <h4 className="fw-bold mb-3">Delivery & Shipping Address</h4>
              <form onSubmit={handleFinalOrderSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Full Name</label>
                    <input type="text" className="form-control" name="fullName" required value={shippingAddress.fullName} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input type="text" className="form-control" name="phone" required value={shippingAddress.phone} onChange={handleInputChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Street Address</label>
                    <input type="text" className="form-control" name="streetAddress" required value={shippingAddress.streetAddress} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">City</label>
                    <input type="text" className="form-control" name="city" required value={shippingAddress.city} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">State</label>
                    <input type="text" className="form-control" name="state" required value={shippingAddress.state} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Pincode</label>
                    <input type="text" className="form-control" name="pincode" required value={shippingAddress.pincode} onChange={handleInputChange} />
                  </div>
                </div>

                <h5 className="fw-bold mt-4 mb-2">Payment Method</h5>
                <div className="border rounded p-3 bg-light d-flex gap-4">
                  <div className="form-check">
                    <input type="radio" className="form-check-input" name="payment" id="cod" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                    <label className="form-check-label fw-medium" htmlFor="cod">Cash on Delivery (COD)</label>
                  </div>
                  <div className="form-check">
                    <input type="radio" className="form-check-input" name="payment" id="upi" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                    <label className="form-check-label fw-medium" htmlFor="upi">UPI / Scanner</label>
                  </div>
                </div>

                <div className="d-flex gap-3 mt-4">
                  <button type="button" className="btn btn-outline-secondary w-50" onClick={() => setShowOrderForm(false)}>Back to Cart</button>
                  <button type="submit" className="btn btn-dark w-50 fw-bold" disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Side Column: Order Breakdown Section */}
        <div className="col-md-5">
          <div className="card p-4 shadow-sm border-0 rounded-3 bg-white">
            <h5 className="fw-bold mb-3">Order Summary ({totalItemsCount} items)</h5>
            <div className="d-flex flex-column gap-2 border-top pt-3">
              <div className="d-flex justify-content-between text-muted">
                <span>Original Total</span>
                <span>₹{priceBreakdown.originalTotal.toFixed(2)}</span>
              </div>
              {priceBreakdown.discountTotal > 0 && (
                <div className="d-flex justify-content-between text-success fw-medium">
                  <span>Product Discount</span>
                  <span>- ₹{priceBreakdown.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between text-muted mb-2">
                <span>Delivery Charges</span>
                <span>FREE</span>
              </div>
              <div className="d-flex justify-content-between border-top pt-3 text-dark">
                <span className="fw-bold fs-5">Total Amount</span>
                <span className="fw-bold fs-4">₹{priceBreakdown.finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {!showOrderForm && (
              <button 
                className="btn btn-dark w-100 mt-4 py-2.5 rounded-3 fw-bold" 
                onClick={() => setShowOrderForm(true)} 
                disabled={cartItems.length === 0}
              >
                Proceed to Place Order
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
