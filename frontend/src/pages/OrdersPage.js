import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const OrdersPage = () => {
  const { token, authUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState({});
  
  // Admin Dashboard State
  const [adminStats, setAdminStats] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // Fetch orders conditionally based on role
  const fetchOrders = useCallback(async () => {
    try {
      // ADMIN gets all orders, normal users get their own
      const endpoint = authUser?.role === 'ADMIN' 
        ? 'http://localhost:5000/api/orders' 
        : 'http://localhost:5000/api/orders/my';

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Could not get orders', err);
    } finally {
      setLoading(false);
    }
  }, [token, authUser]);

  // Fetch Admin-only metrics and users
  const fetchAdminData = useCallback(async () => {
    if (authUser?.role !== 'ADMIN') return;
    try {
      const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAdminStats(response.data.stats);
        setUsersList(response.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    }
  }, [token, authUser]);

  useEffect(() => {
    if (token) {
      fetchOrders();
      if (authUser?.role === 'ADMIN') {
        fetchAdminData();
      }
    }
  }, [token, authUser, fetchOrders, fetchAdminData]);

  const handleFeedbackSubmit = async (orderId) => {
    try {
      await axios.patch(`http://localhost:5000/api/orders/${orderId}/feedback`, 
        { feedback: feedbackText[orderId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('🌟 Thank you! Your feedback has been saved successfully.');
      fetchOrders();
    } catch (err) {
      console.error('Failed to save feedback review notes', err);
      alert('Could not submit comment metrics right now.');
    }
  };

  const handleFeedbackChange = (orderId, value) => {
    setFeedbackText(prev => ({ ...prev, [orderId]: value }));
  };

  // Admin action: Delete User
  const handleDeleteUser = async (targetUserId) => {
    if (window.confirm('⚠️ Are you completely sure? This will permanently delete the user account and erase them from the database.')) {
      try {
        const res = await axios.delete(`http://localhost:5000/api/admin/users/${targetUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          alert('User account successfully deleted.');
          fetchAdminData(); // Refresh list after deletion
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to process user deletion.');
      }
    }
  };

  // Admin action: Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      // FIXED: Standardized target matching unified API layout router paths
      const response = await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert(`Order status updated to: ${newStatus}`);
        fetchOrders(); // Refresh orders to update the progress bar
      }
    } catch (err) {
      console.error('Failed to update status', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const getStatusStep = (status) => {
    const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    return steps.indexOf(status);
  };

  return (
    <div className="container py-5">
      
      {/* ========================================== */}
      {/* ADMINISTRATOR DASHBOARD SECTION          */}
      {/* ========================================== */}
      {authUser?.role === 'ADMIN' && (
        <div className="mb-5 pb-4 border-bottom border-2">
          <h3 className="fw-bold text-dark mb-4">👑 Admin Control Center</h3>
          
          {/* Global Statistics Cards */}
          {adminStats && (
            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary bg-opacity-10 text-primary">
                  <h6 className="fw-bold text-uppercase small">Registered Users</h6>
                  <h2 className="fw-bold mb-0">{adminStats.usersCount}</h2>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-success bg-opacity-10 text-success">
                  <h6 className="fw-bold text-uppercase small">Total Products</h6>
                  <h2 className="fw-bold mb-0">{adminStats.productsCount}</h2>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-warning bg-opacity-10 text-dark">
                  <h6 className="fw-bold text-uppercase small">Categories Count</h6>
                  <h2 className="fw-bold mb-0">{adminStats.categoriesCount}</h2>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-danger bg-opacity-10 text-danger">
                  <h6 className="fw-bold text-uppercase small">Total Payments</h6>
                  <h2 className="fw-bold mb-0">{adminStats.paymentsCount}</h2>
                </div>
              </div>
            </div>
          )}

          {/* User Management Table */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-3">Account Management</h5>
            <div className="table-responsive" style={{ maxHeight: '400px' }}>
              <table className="table table-hover align-middle">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No users found.</td></tr>
                  ) : (
                    usersList.map(user => (
                      <tr key={user._id}>
                        <td className="text-muted small fw-mono">{user._id}</td>
                        <td className="fw-bold text-dark">{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.role === 'ADMIN' ? 'bg-primary' : user.role === 'SELLER' ? 'bg-info' : 'bg-secondary'}`}>
                            {user.role || 'USER'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button 
                            className="btn btn-sm btn-outline-danger fw-bold" 
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={user._id === authUser?._id} 
                          >
                            Delete Account
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* ========================================== */}

      <h2 className="fw-bold mb-4 text-dark text-center text-md-start">
        {authUser?.role === 'ADMIN' ? 'All System Orders' : 'Track Your Orders'}
      </h2>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status"></div>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted text-center fs-5 py-5">No orders found.</p>
      ) : (
        <div className="d-flex flex-column gap-5">
          {orders.map((order) => {
            const currentStep = getStatusStep(order.status);
            const isCancelled = order.status === 'Cancelled';

            return (
              <div className="card shadow border-0 rounded-4 p-4 bg-white" key={order._id}>
                
                {/* 1. Order Core Block Parameters Header Banner */}
                <div className="row g-3 border-bottom pb-3 mb-4 bg-light mx-n4 mt-n4 p-4 rounded-top-4 align-items-center">
                  <div className="col-md-3">
                    <span className="text-uppercase tracking-wider text-muted small fw-bold d-block">Order Number</span>
                    <span className="fw-mono fw-bold text-dark text-break small">{order._id}</span>
                    {/* Show customer info if admin */}
                    {authUser?.role === 'ADMIN' && order.user && (
                       <span className="d-block small text-primary fw-bold mt-1">By: {order.user.name}</span>
                    )}
                  </div>
                  <div className="col-md-3">
                    <span className="text-uppercase tracking-wider text-muted small fw-bold d-block">Date Placed</span>
                    <span className="fw-semibold text-secondary">{order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="col-md-3">
                    <span className="text-uppercase tracking-wider text-muted small fw-bold d-block">Payment Method</span>
                    <span className="badge bg-secondary px-2 py-1.5 fs-7">{order.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="col-md-3 text-md-end">
                    <span className="text-uppercase tracking-wider text-muted small fw-bold d-block">Total Cost</span>
                    {/* FIXED: Added defensive fallback optional chains for order values */}
                    <span className="fs-4 fw-bold text-dark">₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</span>
                  </div>
                </div>

                {/* ADMIN ONLY: Order Status Update Bar */}
                {authUser?.role === 'ADMIN' && (
                  <div className="d-flex align-items-center gap-3 bg-warning bg-opacity-10 p-3 mb-4 rounded-3 border border-warning border-opacity-25">
                    <strong className="text-dark m-0">🛠️ Admin Action: Update Logistics Status</strong>
                    <select 
                      className="form-select form-select-sm w-auto fw-bold cursor-pointer"
                      value={order.status || 'Pending'}
                      onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                {/* 2. Real-Time Tracking Progress Multi-Step Stepper Display Bar */}
                <div className="my-4 px-2">
                  <h6 className="fw-bold mb-4 text-secondary text-uppercase tracking-wide small">Order Progress Tracker</h6>
                  {isCancelled ? (
                    <div className="alert alert-danger border-0 text-center fw-bold rounded-3 py-2">
                      ❌ This transaction has been completely Cancelled.
                    </div>
                  ) : (
                    <div className="position-relative d-flex justify-content-between align-items-center mb-5 mt-2">
                      <div className="position-absolute start-0 top-50 translate-middle-y bg-secondary bg-opacity-20 w-100" style={{ height: '4px', zIndex: 1 }}></div>
                      <div className="position-absolute start-0 top-50 translate-middle-y bg-success w-100" style={{ height: '4px', zIndex: 1, width: `${(currentStep / 3) * 100}%`, transition: 'all 0.5s ease-in-out' }}></div>

                      {['Ordered', 'Processing', 'Dispatched', 'Delivered'].map((stepName, stepIdx) => {
                        const isDone = stepIdx <= currentStep;
                        return (
                          <div className="d-flex flex-column align-items-center position-relative" key={stepIdx} style={{ zIndex: 2 }}>
                            <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold border-2 border ${isDone ? 'bg-success text-white border-success' : 'bg-white text-muted border-secondary border-opacity-50'}`} style={{ width: '38px', height: '38px', transition: 'all 0.3s ease' }}>
                              {isDone ? '✓' : stepIdx + 1}
                            </div>
                            <span className={`small fw-bold mt-2 position-absolute top-100 text-nowrap ${isDone ? 'text-success' : 'text-muted'}`}>
                              {stepName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Itemized Order Tables List & Customer Delivery Coordinates Card Grid */}
                <div className="row g-4 mt-4 pt-2">
                  <div className="col-lg-7 border-end pe-lg-4">
                    <h6 className="fw-bold mb-3 text-secondary text-uppercase tracking-wide small">Purchased Item Summaries</h6>
                    <div className="table-responsive">
                      <table className="table table-borderless align-middle mb-0">
                        <thead>
                          <tr className="border-bottom text-muted small">
                            <th>Product Detail</th>
                            <th className="text-center">Qty</th>
                            <th className="text-end">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items && order.items.map((item, idx) => (
                            <tr key={idx} className="border-bottom-dashed">
                              <td>
                                <div className="d-flex align-items-center gap-3 py-2">
                                  <img src={item.product?.image || 'https://via.placeholder.com/60?text=No+Image'} alt="" className="rounded shadow-sm border p-1 bg-white" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                                  <div>
                                    <span className="fw-bold text-dark d-block text-truncate" style={{ maxWidth: '240px' }}>{item.product?.title || 'Product Stock'}</span>
                                    {/* FIXED: Safe currency metrics parsing protection */}
                                    <small className="text-muted">Unit price: ₹{item.price ? item.price.toFixed(2) : '0.00'}</small>
                                  </div>
                                </div>
                              </td>
                              <td className="text-center fw-semibold text-dark">x{item.quantity || 0}</td>
                              <td className="text-end fw-bold text-dark">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="col-lg-5 ps-lg-4">
                    <h6 className="fw-bold mb-3 text-secondary text-uppercase tracking-wide small">Delivery Address Coordinates</h6>
                    <div className="p-3 rounded-3 bg-light border border-light">
                      <h6 className="fw-bold text-dark mb-2">{order.shippingAddress?.fullName}</h6>
                      <p className="text-secondary small mb-1">{order.shippingAddress?.address}</p>
                      <p className="text-secondary small mb-3">{order.shippingAddress?.city}, {order.shippingAddress?.state} - <strong className="text-dark">{order.shippingAddress?.pincode}</strong></p>
                      <div className="d-flex align-items-center gap-1 small text-dark border-top pt-2 mt-2">
                        <span>📞 Phone:</span>
                        <span className="fw-semibold">{order.shippingAddress?.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. CONDITIONAL FEATURE: Live Item Feedback Post Forms Container */}
                {order.status === 'Delivered' && (
                  <div className="mt-4 pt-4 border-top">
                    <div className="card p-3 border-success border-opacity-25 rounded-3 bg-success bg-opacity-10">
                      <h6 className="fw-bold text-success mb-2">💬 Share Your Valuable Experience</h6>
                      <p className="small text-muted mb-3">Since your order has been successfully delivered, please provide your feedback below to help us continuously optimize our ecosystem support.</p>
                      
                      {order.feedback ? (
                        <div className="p-2 border rounded-2 bg-white small text-dark italic">
                          <strong>Submitted Feedback:</strong> "{order.feedback}"
                        </div>
                      ) : (
                        <div className="d-flex flex-column flex-sm-row gap-2">
                          <input 
                            type="text" 
                            className="form-control bg-white" 
                            placeholder="Write your brief review metrics here..." 
                            value={feedbackText[order._id] || ''} 
                            onChange={(e) => handleFeedbackChange(order._id, e.target.value)}
                            disabled={authUser?.role === 'ADMIN'} 
                          />
                          <button 
                            type="button" 
                            className="btn btn-success px-4 fw-bold"
                            onClick={() => handleFeedbackSubmit(order._id)}
                            disabled={!feedbackText[order._id]?.trim() || authUser?.role === 'ADMIN'}
                          >
                            Submit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;