import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend);

// GHOST ORDERS EXCLUSION LIST FOR FRONTEND SAFETY LAYER
const EXCLUDED_ORDER_IDS = ['6a4a30559515580573759cc1', '6a4a3b4b2702d08fea7fe323'];

const AdminPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState({ COD: 0, Card: 0, UPI: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemAlert, setSystemAlert] = useState({ text: '', type: '' });

  // Category Modification Form State Managers
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryInput, setEditCategoryInput] = useState('');

  // Local calculation states for fast breakdown display
  const [userCount, setUserCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);

  const fetchAdminDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setAnalytics(response.data.metrics);
        const userList = response.data.users || [];
        setUsers(userList);
        
        // --- SURGICAL FRONTEND FILTER FOR GHOST ORDERS ---
        const rawOrdersList = response.data.orders || [];
        const cleanOrdersList = rawOrdersList.filter(
          (order) => !EXCLUDED_ORDER_IDS.includes(order._id)
        );
        setOrders(cleanOrdersList);
        // -------------------------------------------------

        setPayments(response.data.payments || { COD: 0, Card: 0, UPI: 0 });
        setCategories(response.data.categories || []);

        // Calculate explicit role breakdowns locally from retrieved collection mapping
        const onlyUsers = userList.filter(u => u.role === 'USER').length;
        const onlySellers = userList.filter(u => u.role === 'SELLER').length;
        setUserCount(onlyUsers);
        setSellerCount(onlySellers);
      }
    } catch (error) {
      console.error('Failed to load administrative control segments.', error);
      setSystemAlert({ text: 'Access verification error or backend network failure.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAdminDashboard();
    }
  }, [token, fetchAdminDashboard]);

  const handleUpdateStatus = async (orderId, targetStatus) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: targetStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSystemAlert({ text: `Fulfillment status shifted to "${targetStatus}" globally!`, type: 'success' });
        fetchAdminDashboard(); 
      }
    } catch (err) {
      setSystemAlert({ text: 'Fulfillment status amendment rejected by backend server.', type: 'danger' });
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete user "${name}"? This action removes them permanently from the website database ecosystem.`)) {
      try {
        const res = await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setSystemAlert({ text: res.data.message || 'User account permanently terminated.', type: 'warning' });
          fetchAdminDashboard();
        }
      } catch (err) {
        setSystemAlert({ text: err.response?.data?.message || 'Failed to remove user account privilege.', type: 'danger' });
      }
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/admin/categories', 
        { categoryName: newCategoryInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSystemAlert({ text: res.data.message || 'Category successfully added.', type: 'success' });
        setNewCategoryInput('');
        fetchAdminDashboard();
      }
    } catch (err) {
      setSystemAlert({ text: err.response?.data?.message || 'Failed to initialize catalog field.', type: 'danger' });
    }
  };

  const handleRenameCategory = async (oldName) => {
    if (!editCategoryInput.trim() || editCategoryInput === oldName) {
      setEditingCategory(null);
      return;
    }
    try {
      const res = await axios.put('http://localhost:5000/api/admin/categories/rename',
        { oldName, newName: editCategoryInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSystemAlert({ text: res.data.message || 'Category successfully renamed.', type: 'success' });
        setEditingCategory(null);
        fetchAdminDashboard();
      }
    } catch (err) {
      setSystemAlert({ text: 'Failed to update category classification label.', type: 'danger' });
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (window.confirm(`⚠️ WARNING: Deleting "${catName}" will permanently wipe out all inventory items belonging to this classification from the active display grids. Continue?`)) {
      try {
        const res = await axios.delete(`http://localhost:5000/api/admin/categories/${encodeURIComponent(catName)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setSystemAlert({ text: res.data.message || 'Category classification dropped.', type: 'warning' });
          fetchAdminDashboard();
        }
      } catch (err) {
        setSystemAlert({ text: 'Category removal protocol interrupted by host.', type: 'danger' });
      }
    }
  };

  const chartData = {
    labels: ['Total Orders Placed', 'Gross Revenue (x10)'],
    datasets: [
      {
        data: [analytics?.totalOrders || 0, (analytics?.dailyRevenue || 0) / 10],
        backgroundColor: ['#4f46e5', '#10b981'],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Syncing Core Infrastructure Modules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Upper Dashboard Panel Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark tracking-tight mb-1">Administrative Matrix Center</h2>
          <p className="text-muted small mb-0">Platform overview controls for users, fulfillment states, active categories, and financial data logs.</p>
        </div>
        <button className="btn btn-dark fw-bold btn-sm mt-3 mt-md-0 px-3 py-2 rounded-3 shadow-sm" onClick={fetchAdminDashboard}>
          🔄 Refresh Cloud Environment Data
        </button>
      </div>

      {systemAlert.text && (
        <div className={`alert alert-${systemAlert.type} alert-dismissible fade show fw-medium shadow-sm mb-4`} role="alert">
          {systemAlert.text}
          <button type="button" className="btn-close" onClick={() => setSystemAlert({ text: '', type: '' })}></button>
        </div>
      )}

      {/* Modern Pill Tab Control Deck */}
      <div className="card shadow-sm border-0 mb-4 bg-white p-2 rounded-3">
        <ul className="nav nav-pills gap-2 flex-wrap">
          {[
            { id: 'overview', label: '📊 Admin Overview' },
            { id: 'users', label: '👥 User Profiles Deck' },
            { id: 'orders', label: '📦 Order Stream Board' },
            { id: 'payments', label: '💳 Payment Channels' },
            { id: 'categories', label: '📁 Active Category Hub' }
          ].map((tab) => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link fw-bold px-4 py-2.5 rounded-3 border-0 transition-all ${activeTab === tab.id ? 'bg-dark text-white shadow' : 'text-secondary bg-light'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Panels */}
      <div className="tab-content mt-2">
        
        {/* MODULE A: ANALYTICS OVERVIEW CARDS */}
        {activeTab === 'overview' && (
          <div>
            <div className="row g-4">
              {[
                { title: 'Gross Total Capital', val: `₹${analytics?.dailyRevenue?.toLocaleString() || 0}`, desc: 'Accumulated business revenue channel flow', color: 'text-success' },
                { title: 'System Invoices', val: analytics?.totalOrders || 0, desc: 'Total successfully processed checkouts', color: 'text-dark' },
                { title: 'Registered Users', val: userCount, desc: 'Active platform customer accounts', color: 'text-primary' },
                { title: 'Registered Sellers', val: sellerCount, desc: 'Verified system merchant profile units', color: 'text-info' },
                { title: 'Total Products', val: analytics?.totalProducts || 0, desc: 'Live listed inventory units available', color: 'text-secondary' },
                { title: 'Catalog Categories', val: analytics?.totalCategories || 0, desc: 'Unique product item groups deployed live', color: 'text-warning' }
              ].map((card, idx) => (
                <div className="col-12 col-sm-6 col-xl-4" key={idx}>
                  <div className="card p-4 shadow-sm border-0 bg-white rounded-3 h-100 transition-hover">
                    <h6 className="text-uppercase tracking-wider text-muted small fw-bold mb-2">{card.title}</h6>
                    <p className={`fs-2 fw-bold ${card.color} mb-1`}>{card.val}</p>
                    <small className="text-muted text-xs">{card.desc}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* QUICK LINK DATA OVERVIEW TABLE INSIDE OVERVIEW SECTION */}
            <div className="card p-4 shadow-sm border-0 bg-white rounded-3 mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Direct Operations Console</h5>
                  <p className="text-muted small mb-0">Perform quick actions or instantly wipe problem accounts from storage maps without leaving your overview tab.</p>
                </div>
                <button className="btn btn-outline-dark btn-sm fw-bold px-3 rounded-3" onClick={() => setActiveTab('users')}>
                  Go to Profiles Deck →
                </button>
              </div>
              <div className="table-responsive">
                <table className="table align-middle table-hover mb-0">
                  <thead className="table-light">
                    <tr className="text-muted small text-uppercase">
                      <th>Profile Name</th>
                      <th>Email Address Identifier</th>
                      <th>Access Classification</th>
                      <th className="text-end">Eradication Protocol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((item) => (
                      <tr key={item._id}>
                        <td className="fw-bold text-dark">{item.name}</td>
                        <td className="text-secondary">{item.email}</td>
                        <td>
                          <span className={`badge px-3 py-1.5 rounded-3 fw-bold ${item.role === 'ADMIN' ? 'bg-danger text-white' : item.role === 'SELLER' ? 'bg-info text-white' : 'bg-light text-dark border'}`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="text-end">
                          <button 
                            className="btn btn-sm btn-danger fw-bold px-3 rounded-3 shadow-sm"
                            onClick={() => handleDeleteUser(item._id, item.name)}
                          >
                            Delete Permanently
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-3">No active consumer or merchant accounts indexed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-4 shadow-sm border-0 bg-white rounded-3 mt-4">
              <h5 className="fw-bold mb-4 text-center text-dark">Data Distribution Analytics Summary</h5>
              <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                <Pie data={chartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>
          </div>
        )}

        {/* MODULE B: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
            <h5 className="fw-bold text-dark mb-1">User Profiles Deck</h5>
            <p className="text-muted small mb-4">View and control member credentials or drop accounts permanently from the application server catalog.</p>
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead className="table-light">
                  <tr className="text-muted small text-uppercase">
                    <th>Profile Name</th>
                    <th>Email Account Identifier</th>
                    <th>System Access Role</th>
                    <th className="text-end">Destructive Safety Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item._id}>
                      <td className="fw-bold text-dark">{item.name}</td>
                      <td className="text-secondary">{item.email}</td>
                      <td>
                        <span className={`badge px-3 py-1.5 rounded-3 fw-bold ${item.role === 'ADMIN' ? 'bg-danger text-white' : item.role === 'SELLER' ? 'bg-warning text-dark' : 'bg-light text-dark border'}`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="text-end">
                        <button 
                          className="btn btn-sm btn-outline-danger fw-bold px-3 rounded-3"
                          onClick={() => handleDeleteUser(item._id, item.name)}
                        >
                          Delete Profile Permanently
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODULE C: ORDER STREAM OVERRIDES */}
        {activeTab === 'orders' && (
          <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
            <h5 className="fw-bold text-dark mb-1">Order Stream Board</h5>
            <p className="text-muted small mb-4">Update an order's milestone stage to instantly adjust the 4-stage stepper status bar across the website layout.</p>
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead className="table-light">
                  <tr className="text-muted small text-uppercase">
                    <th>Invoice ID</th>
                    <th>Customer Details</th>
                    <th>Total Price</th>
                    <th>Active Milestone</th>
                    <th className="text-end">Fulfillment Stage Action Switch</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((elem) => (
                    <tr key={elem._id}>
                      <td className="fw-mono text-secondary small">#{elem._id ? elem._id.substring(elem._id.length - 8).toUpperCase() : 'N/A'}</td>
                      <td>
                        <span className="fw-bold text-dark d-block">{elem.user?.name || 'Guest User'}</span>
                        <small className="text-muted">{elem.user?.email || 'No email associated'}</small>
                      </td>
                      <td className="fw-bold text-dark">₹{elem.totalAmount?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span className={`badge px-3 py-1.5 rounded-pill fw-bold ${elem.status === 'Delivered' ? 'bg-success text-white' : elem.status === 'Cancelled' ? 'bg-danger text-white' : elem.status === 'Shipped' ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                          {elem.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <select 
                          className="form-select form-select-sm d-inline-block w-auto border-secondary fw-bold rounded-3 text-dark bg-white shadow-sm"
                          value={elem.status || 'Pending'}
                          onChange={(e) => handleUpdateStatus(elem._id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODULE D: PAYMENT BREAKDOWNS MATRIX */}
        {activeTab === 'payments' && (
          <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
            <h5 className="fw-bold text-dark mb-1">Financial Settlement Matrices</h5>
            <p className="text-muted small mb-4">Gross operational capital settlement channels filtering completed transactional profiles.</p>
            <div className="row g-4">
              {Object.entries(payments).map(([method, sumTotal]) => (
                <div className="col-12 col-md-4" key={method}>
                  <div className="p-4 rounded-3 bg-light border shadow-sm text-center">
                    <span className="badge bg-dark px-3 py-2 text-uppercase mb-3 tracking-wide fw-bold">{method} Core Gateway</span>
                    <h3 className="fw-bold text-dark mt-1 mb-0">
                      ₹{typeof sumTotal === 'number' ? sumTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE E: DYNAMIC CATEGORIES CRUDS WORKSPACE */}
        {activeTab === 'categories' && (
          <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
            <h5 className="fw-bold text-dark mb-1">Category Control Hub</h5>
            <p className="text-muted small mb-4">Add, rename, or delete systemic collection scopes from live market configurations.</p>
            
            {/* Inline Creation Tool */}
            <form onSubmit={handleAddCategory} className="d-flex gap-2 max-w-md mb-4 bg-light p-3 rounded-3 border">
              <input 
                type="text" 
                className="form-control bg-white rounded-3 fw-medium"
                placeholder="Ex: Electronics, Fashion, Home..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
              />
              <button type="submit" className="btn btn-dark fw-bold px-4 rounded-3 text-nowrap">
                ➕ Create Category
              </button>
            </form>

            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead className="table-light">
                  <tr className="text-muted small text-uppercase">
                    <th>Classification Identity</th>
                    <th className="text-end">Management System Updates</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((group) => (
                    <tr key={group}>
                      <td>
                        {editingCategory === group ? (
                          <div className="d-flex gap-2 align-items-center">
                            <input 
                              type="text" 
                              className="form-control form-control-sm w-50 fw-bold"
                              value={editCategoryInput}
                              onChange={(e) => setEditCategoryInput(e.target.value)}
                            />
                            <button className="btn btn-sm btn-success fw-bold px-2 rounded" onClick={() => handleRenameCategory(group)}>Save</button>
                            <button className="btn btn-sm btn-secondary fw-bold px-2 rounded" onClick={() => setEditingCategory(null)}>Cancel</button>
                          </div>
                        ) : (
                          <span className="fw-bold text-dark fs-6">📁 {group}</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button 
                            className="btn btn-sm btn-outline-secondary fw-bold px-3 rounded-3"
                            onClick={() => {
                              setEditingCategory(group);
                              setEditCategoryInput(group);
                            }}
                          >
                            Rename Label
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger fw-bold px-3 rounded-3"
                            onClick={() => handleDeleteCategory(group)}
                          >
                            Remove Sector
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPage;