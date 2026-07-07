import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { authUser, logout } = useAuth();
  const navigate = useNavigate();

  // Route protection safety check
  if (!authUser) {
    return (
      <div className="container py-5 text-center">
        <p className="text-muted fw-semibold">Please authenticate to see account profile details.</p>
        <button className="btn btn-primary btn-sm rounded-3 px-4" onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-3 bg-white p-4">
            <div className="text-center mb-4">
              <div 
                className="bg-primary text-white d-inline-flex align-items-center justify-content-center rounded-circle fw-bold shadow-sm" 
                style={{ width: '80px', height: '80px', fontSize: '2rem' }}
              >
                {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h4 className="fw-bold text-dark mt-3 mb-1">{authUser.name}</h4>
              <span className="badge bg-light text-muted border px-2.5 py-1">Customer Account</span>
            </div>

            <hr className="text-muted opacity-25" />

            <h5 className="fw-bold mb-3 text-dark">Basic Account Details</h5>
            
            <div className="mb-3">
              <label className="form-label small fw-semibold text-muted mb-1">Full Name</label>
              <input 
                type="text" 
                className="form-control bg-light border-0 py-2 rounded-3 text-dark" 
                value={authUser.name || ''} 
                readOnly 
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-muted mb-1">Email Address</label>
              <input 
                type="email" 
                className="form-control bg-light border-0 py-2 rounded-3 text-dark" 
                value={authUser.email || ''} 
                readOnly 
              />
            </div>

            <div className="d-flex gap-2 pt-2">
              <button 
                className="btn btn-outline-dark flex-grow-1 py-2 rounded-3 fw-bold small" 
                onClick={() => navigate('/orders')}
              >
                📦 View Order History
              </button>
              <button 
                className="btn btn-danger flex-grow-1 py-2 rounded-3 fw-bold small" 
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;