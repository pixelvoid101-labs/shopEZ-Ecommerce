import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WishlistPage = () => {
  const { authUser } = useAuth();
  const [items, setItems] = useState([]);

  const userEmail = authUser && (authUser.id || authUser.email) ? (authUser.id || authUser.email) : 'guest';
  const wishlistKey = `shopez-wishlist-${userEmail}`;

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem(wishlistKey) || '[]'));
  }, [wishlistKey]);

  const handleRemove = (id) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    localStorage.setItem(wishlistKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="container py-5">
      <h3 className="fw-bold mb-4">❤️ Your Saved Wishlist</h3>
      {items.length === 0 ? (
        <p className="text-muted">Your wishlist is currently empty.</p>
      ) : (
        <div className="row g-4">
          {items.map(item => (
            <div className="col-md-3 col-sm-6" key={item.id}>
              <div className="card h-100 shadow-sm border-0 position-relative">
                <button onClick={() => handleRemove(item.id)} className="btn btn-sm btn-light rounded-circle position-absolute top-0 end-0 m-2 shadow-sm">✕</button>
                <img src={item.image || 'https://via.placeholder.com/300x200?text=No+Image'} className="card-img-top object-fit-cover" style={{ height: '180px' }} alt={item.title} />
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                    <span className="text-muted small text-uppercase">{item.category}</span>
                    <h6 className="fw-bold text-dark text-truncate mt-1">{item.title}</h6>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="fw-bold text-dark fs-5">₹{item.price}</span>
                    <Link to={`/product/${item.id}`} className="btn btn-dark btn-sm rounded px-3">View</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;