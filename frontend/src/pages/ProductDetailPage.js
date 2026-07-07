import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const [product, setProduct] = useState(null);
  
  // Review inputs
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  const userEmail = authUser && (authUser.id || authUser.email) ? (authUser.id || authUser.email) : 'guest';
  const cartKey = `shopez-cart-${userEmail}`;

  // Memoized callback method satisfying full lint parameters
  const fetchProduct = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/products/${id}`);
      if (response.data.success) {
        setProduct(response.data.product);
      }
    } catch (error) {
      console.error('Failed to load product', error);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [id, fetchProduct]);

  const updateCartStorage = () => {
    const finalPrice = product.discount > 0 
      ? parseFloat((product.price * (1 - product.discount / 100)).toFixed(2))
      : product.price;

    const cartItem = {
      id: product._id,
      title: product.title,
      price: finalPrice,
      image: product.image,
      quantity: 1,
    };

    const existing = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const existingIndex = existing.findIndex(item => item.id === product._id);
    
    if (existingIndex > -1) {
      existing[existingIndex].quantity += 1;
    } else {
      existing.push(cartItem);
    }
    
    localStorage.setItem(cartKey, JSON.stringify(existing));
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddToCart = () => {
    if (!authUser) {
      navigate('/login');
      return;
    }
    updateCartStorage();
    alert('Item successfully added to your Cart!');
  };

  const handleBuyNow = () => {
    if (!authUser) {
      navigate('/login');
      return;
    }
    updateCartStorage();
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!authUser) {
      alert('Please log in to leave a review.');
      return;
    }
    if (!comment.trim()) {
      setReviewError('Please write your thoughts in the comment section.');
      return;
    }

    try {
      const token = localStorage.getItem('shopez-token') || ''; 
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post(`http://localhost:5000/api/products/${id}/reviews`, {
        rating,
        comment
      }, config);

      if (response.data.success) {
        setProduct(response.data.product);
        setComment('');
        setRating(5);
        setReviewError('');
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to persist customer review.');
    }
  };

  if (!product) {
    return <div className="container py-5 text-center fw-semibold">Loading product views...</div>;
  }

  const calculatedPrice = product.discount > 0 
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price;

  // Review Aggregators
  const totalReviews = product.reviews?.length || 0;
  const avgRating = totalReviews > 0 
    ? (product.reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  // Calculate Breakdown distribution percentages
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (totalReviews > 0) {
    product.reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
    Object.keys(distribution).forEach(key => {
      distribution[key] = Math.round((distribution[key] / totalReviews) * 100);
    });
  }

  return (
    <div className="container py-5">
      <div className="row g-4">
        {/* Left Side Column - Metadata View */}
        <div className="col-md-7">
          <div className="p-4 bg-white rounded-3 border-0 shadow-sm mb-4">
            <div className="text-center mb-4 bg-light p-3 rounded" style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <img src={product.image || 'https://via.placeholder.com/300?text=No+Image'} alt={product.title} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            </div>
            
            <p className="text-uppercase text-muted small fw-bold mb-1">{product.category}</p>
            <h2 className="fw-bold text-dark">{product.title}</h2>
            
            <div className="d-flex align-items-center gap-2 my-2">
              <span className="badge bg-warning text-dark px-2">★ {avgRating}</span>
              <span className="text-muted small">({totalReviews} verified review{totalReviews !== 1 && 's'})</span>
              <span className="ms-auto text-success fw-bold small">{product.inventoryCount > 0 ? `${product.inventoryCount} in stock` : 'Out of Stock'}</span>
            </div>

            <div className="d-flex align-items-baseline gap-2 my-3">
              <span className="fw-bold fs-2 text-dark">₹{calculatedPrice}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-muted text-decoration-line-through fs-5">₹{product.price}</span>
                  <span className="text-success small fw-bold">You save ₹{(product.price - calculatedPrice).toFixed(2)}</span>
                </>
              )}
            </div>
            
            <hr />
            <p className="text-secondary" style={{ lineHeight: '1.6' }}>{product.description}</p>
            
            {product.discount > 0 && (
              <div className="badge bg-light text-danger border border-danger-subtle px-3 py-2 mt-2 fw-bold">
                {product.discount}% OFF AVAILABLE
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="p-4 bg-white rounded-3 border-0 shadow-sm mb-4">
            <h5 className="fw-bold mb-3 text-dark">Customer Reviews</h5>
            {totalReviews === 0 ? (
              <p className="text-muted small my-3">No evaluations yet. Be the first to express feedback!</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {product.reviews.map((rev, idx) => (
                  <div key={idx} className="p-3 bg-light rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small text-dark">{rev.user}</span>
                      <span className="badge bg-warning text-dark scale-90">★ {rev.rating}</span>
                    </div>
                    <small className="text-muted text-xs block mb-2">{new Date(rev.createdAt).toLocaleDateString()}</small>
                    <p className="text-secondary small mb-0">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave a review box */}
          <div className="p-4 bg-white rounded-3 border-0 shadow-sm">
            <h5 className="fw-bold mb-3 text-dark">Share your review</h5>
            <form onSubmit={handleReviewSubmit}>
              {reviewError && <div className="alert alert-danger py-2 small">{reviewError}</div>}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Rating</label>
                <select className="form-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Comment</label>
                <textarea className="form-select text-start" rows="3" placeholder="Tell us what you think..." value={comment} onChange={(e) => setComment(e.target.value)} style={{ resize: 'none' }}></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-100 fw-bold rounded-3 py-2">Submit review</button>
            </form>
          </div>
        </div>

        {/* Right Side Column - Checkout Buttons & Breakdown Metrics */}
        <div className="col-md-5">
          {/* Purchase Actions */}
          <div className="card p-4 shadow-sm border-0 rounded-3 bg-white mb-4">
            <h5 className="fw-bold mb-3 text-dark">Available offers</h5>
            <ul className="small text-muted ps-3 mb-4">
              <li>Bank offer 10% instant discount</li>
              <li>Free delivery on orders above ₹500</li>
              <li>Easy returns and exchange</li>
            </ul>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-dark flex-grow-1 py-2.5 rounded-3 fw-bold" onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button className="btn btn-warning flex-grow-1 py-2.5 rounded-3 fw-bold text-dark" onClick={handleBuyNow} style={{ backgroundColor: '#cc9900', border: 'none' }}>
                Buy Now
              </button>
            </div>
          </div>

          {/* Visual Star Matrix Bars */}
          <div className="card p-4 shadow-sm border-0 rounded-3 bg-white">
            <h5 className="fw-bold mb-1 text-dark">Rating Breakdown</h5>
            <div className="d-flex align-items-baseline gap-2 mb-3">
              <span className="fs-1 fw-bold text-dark">{avgRating}</span>
              <span className="text-warning fs-4">★</span>
              <span className="text-muted small">{totalReviews} verified reviews</span>
            </div>

            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="d-flex align-items-center gap-2 mb-2 small text-muted">
                <div style={{ width: '20px' }}>{star}★</div>
                <div className="progress flex-grow-1 rounded-pill" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-warning rounded-pill" 
                    role="progressbar" 
                    style={{ width: `${distribution[star]}%` }}
                    aria-valuenow={distribution[star]} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <div style={{ width: '35px', textAlign: 'right' }}>{distribution[star]}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;