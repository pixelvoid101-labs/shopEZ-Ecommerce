import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CatalogPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notification, setNotification] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { authUser } = useAuth();

  const userEmail = authUser && (authUser.id || authUser.email) ? (authUser.id || authUser.email) : 'guest';
  const cartKey = `shopez-cart-${userEmail}`;
  const wishlistKey = `shopez-wishlist-${userEmail}`;

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const savedWishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
      setCart(savedCart);
      setWishlist(savedWishlist);
    } catch (e) {
      setCart([]);
      setWishlist([]);
    }
  }, [cartKey, wishlistKey]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setSearch(queryParams.get('search') || '');
  }, [location]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/products', {
          params: { search },
        });
        setProducts(response.data.products || []);
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search]);

  // Safely extracts items containing an active markdown discount rate
  const featuredProducts = useMemo(() => products.filter(p => p.discount > 0), [products]);

  const updateCartAndSync = (newCart) => {
    setCart(newCart);
    localStorage.setItem(cartKey, JSON.stringify(newCart));
    window.dispatchEvent(new Event('storage'));
  };

  const handleToggleWishlist = (e, product) => {
    e.stopPropagation();
    e.preventDefault();
    if (!authUser) { navigate('/login'); return; }

    let updatedWishlist = [...wishlist];
    const isFav = updatedWishlist.some(item => item.id === product._id);

    if (isFav) {
      updatedWishlist = updatedWishlist.filter(item => item.id !== product._id);
      setNotification(`Removed "${product.name || product.title}" from Wishlist`);
    } else {
      updatedWishlist.push({
        id: product._id,
        title: product.name || product.title,
        price: product.discount > 0 ? parseFloat((product.price * (1 - product.discount / 100)).toFixed(2)) : product.price,
        image: product.image,
        category: product.category
      });
      setNotification(`❤️ Added "${product.name || product.title}" to Wishlist!`);
    }

    setWishlist(updatedWishlist);
    localStorage.setItem(wishlistKey, JSON.stringify(updatedWishlist));
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => setNotification(''), 2500);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation(); e.preventDefault();
    if (!authUser) { navigate('/login'); return; }

    const finalPrice = product.discount > 0 ? parseFloat((product.price * (1 - product.discount / 100)).toFixed(2)) : product.price;
    const currentCart = [...cart];
    const itemIndex = currentCart.findIndex((item) => item.id === product._id);
    
    if (itemIndex > -1) {
      currentCart[itemIndex].quantity += 1;
    } else {
      currentCart.push({
        id: product._id,
        title: product.name || product.title,
        price: finalPrice,
        originalPrice: product.price,
        discountPercentage: product.discount || 0,
        image: product.image,
        quantity: 1
      });
    }

    updateCartAndSync(currentCart);
    setNotification(`🎉 Added "${product.name || product.title}" to cart!`);
    setTimeout(() => setNotification(''), 2500);
  };

  const handleDecreaseQuantity = (e, productId) => {
    e.stopPropagation(); e.preventDefault();
    const updated = cart.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0);
    updateCartAndSync(updated);
  };

  return (
    <div className="container py-4 position-relative">
      {notification && (
        <div className="position-fixed bottom-0 end-0 m-4 alert alert-dark shadow-lg border-0 text-white px-4 py-3" style={{ zIndex: 9999, backgroundColor: '#111215', borderRadius: '10px' }}>
          {notification}
        </div>
      )}

      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-dark">Discover Our Exclusive Collection</h2>
          <p className="text-muted">Compare the best offers and unlock premium deals smoothly.</p>
        </div>
      </div>

      {/* RESTORED: Limited Time Deals Section */}
      {!search && featuredProducts.length > 0 && (
        <div className="mb-5 p-4 rounded-3" style={{ backgroundColor: '#fff5f5', border: '1px solid #ffe3e3' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{ fontSize: '24px' }}>⚡</span>
            <h3 className="fw-bold text-danger mb-0">Limited Time Deals</h3>
          </div>
          <div className="row g-3 flex-nowrap overflow-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            {featuredProducts.map((product) => {
              const cartItem = cart.find(item => item.id === product._id);
              const currentQty = cartItem ? cartItem.quantity : 0;
              const finalPrice = (product.price * (1 - product.discount / 100)).toFixed(2);

              return (
                <div className="col-10 col-sm-6 col-md-4 col-lg-3" key={product._id} style={{ flexShrink: 0 }}>
                  <div className="card h-100 shadow-sm border-0 position-relative rounded-3 overflow-hidden">
                    <span className="position-absolute top-0 start-0 badge bg-danger m-2 px-2 py-1 shadow" style={{ zIndex: 2 }}>
                      -{product.discount}% OFF
                    </span>
                    <Link to={`/product/${product._id}`}>
                      <div className="bg-white" style={{ height: '160px' }}>
                        <img src={product.image || 'https://via.placeholder.com/300x160?text=No+Image'} alt={product.title} className="w-100 h-100 object-fit-contain p-2" />
                      </div>
                    </Link>
                    <div className="card-body p-3 bg-light d-flex flex-column justify-content-between">
                      <div>
                        <h6 className="fw-bold text-dark text-truncate mb-1">{product.title || product.name}</h6>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="fw-bold text-danger fs-5">₹{finalPrice}</span>
                          <span className="text-muted text-decoration-line-through small">₹{product.price}</span>
                        </div>
                      </div>
                      {currentQty > 0 ? (
                        <div className="d-flex align-items-center justify-content-between border border-warning rounded p-1 bg-white w-100">
                          <button className="btn btn-sm btn-light fw-bold px-2 py-0" onClick={(e) => handleDecreaseQuantity(e, product._id)}>-</button>
                          <span className="fw-bold text-dark small">{currentQty} active</span>
                          <button className="btn btn-sm btn-light fw-bold px-2 py-0" onClick={(e) => handleAddToCart(e, product)}>+</button>
                        </div>
                      ) : (
                        <button className="btn btn-danger btn-sm w-100 fw-bold rounded" onClick={(e) => handleAddToCart(e, product)}>
                          Claim Deal 🛒
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Catalog View Grid */}
      <h3 className="fw-bold mb-4 text-dark">{search ? `Search Results for "${search}"` : 'Trending Products'}</h3>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-5 text-muted fs-5">No products found.</div>
      ) : (
        <div className="row g-4">
          {products.map((product) => {
            const cartItem = cart.find(item => item.id === product._id);
            const currentQty = cartItem ? cartItem.quantity : 0;
            const isFavorite = wishlist.some(item => item.id === product._id);
            const finalPrice = product.discount > 0 ? (product.price * (1 - product.discount / 100)).toFixed(2) : product.price;

            return (
              <div className="col-sm-6 col-md-4 col-lg-3" key={product._id}>
                <div className="text-decoration-none card h-100 shadow-sm border-0 rounded-3 overflow-hidden d-flex flex-column text-dark position-relative">
                  
                  {/* Floating Heart Button */}
                  <button 
                    onClick={(e) => handleToggleWishlist(e, product)} 
                    className="btn position-absolute top-0 end-0 m-2 rounded-circle shadow-sm bg-white border-0 d-flex align-items-center justify-content-center"
                    style={{ width: '36px', height: '36px', zIndex: 10 }}
                  >
                    <span style={{ fontSize: '18px', color: isFavorite ? 'red' : '#bbb' }}>
                      {isFavorite ? '❤️' : '♡'}
                    </span>
                  </button>

                  <Link to={`/product/${product._id}`} className="text-decoration-none text-dark d-block">
                    <div className="bg-light position-relative" style={{ height: '220px', overflow: 'hidden' }}>
                      <img src={product.image || 'https://via.placeholder.com/300x220?text=No+Image'} alt={product.title} className="w-100 h-100 object-fit-cover" />
                      {product.discount > 0 && (
                        <span className="position-absolute top-0 start-0 badge bg-danger m-2 px-2 py-1.5 rounded-2 shadow">
                          SAVE {product.discount}%
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <span className="text-uppercase text-xs fw-bold text-muted small">{product.category}</span>
                      <h5 className="card-title text-dark fs-6 fw-semibold text-truncate-2 mt-1 mb-2" style={{ height: '42px', overflow: 'hidden' }}>
                        {product.name || product.title}
                      </h5>
                      <p className="card-text text-muted small text-truncate-3 mb-3" style={{ height: '54px', overflow: 'hidden' }}>
                        {product.description}
                      </p>
                    </div>

                    <div>
                      <div className="d-flex align-items-baseline gap-2 mb-2">
                        <span className="fs-4 fw-bold text-dark">₹{finalPrice}</span>
                        {product.discount > 0 && <span className="text-muted text-decoration-line-through small">₹{product.price}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-footer bg-white p-3 pt-0 border-0">
                    {currentQty > 0 ? (
                      <div className="d-flex align-items-center justify-content-between border border-warning rounded-pill p-1 bg-white mx-auto w-100">
                        <button className="btn btn-sm btn-light rounded-circle fw-bold px-3" onClick={(e) => handleDecreaseQuantity(e, product._id)}>-</button>
                        <span className="fw-bold text-dark small">{currentQty} in cart</span>
                        <button className="btn btn-sm btn-light rounded-circle fw-bold px-3" onClick={(e) => handleAddToCart(e, product)}>+</button>
                      </div>
                    ) : (
                      <button className="btn btn-dark w-100 py-2 fw-semibold rounded-2" onClick={(e) => handleAddToCart(e, product)}>
                        🛒 Add to Cart
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;