import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const calculateCounts = () => {
      if (!authUser) {
        setCartCount(0);
        setWishlistCount(0);
        return;
      }
      const userEmail = authUser.id || authUser.email;
      const cartKey = `shopez-cart-${userEmail}`;
      const wishlistKey = `shopez-wishlist-${userEmail}`;

      const savedCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const savedWishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');

      setCartCount(savedCart.reduce((acc, item) => acc + item.quantity, 0));
      setWishlistCount(savedWishlist.length);
    };

    calculateCounts();

    window.addEventListener('storage', calculateCounts);
    return () => {
      window.removeEventListener('storage', calculateCounts);
    };
  }, [authUser]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/catalog?search=${encodeURIComponent(localSearch)}`);
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-2 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold fs-4" to="/">
            ShopEZ
          </Link>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon" />
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            {/* Search Bar - Visible to everyone */}
            <form onSubmit={handleSearchSubmit} className="d-flex mx-auto col-12 col-md-5 my-2 my-lg-0 position-relative">
              <input
                className="form-control px-3 py-1.5 border-0 rounded bg-white text-dark"
                type="search"
                placeholder="Search for products, brands and more..."
                style={{ fontSize: '14px', paddingRight: '40px' }}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <button className="btn position-absolute end-0 top-0 h-100 border-0 bg-transparent text-muted" type="submit">
                🔍
              </button>
            </form>

            <div className="d-flex align-items-center gap-3 ms-auto mt-2 mt-lg-0">
              {authUser ? (
                <>
                  {/* Dynamic 'Manage Products' view injected strictly for SELLER and ADMIN accounts */}
                  {(authUser.role === 'SELLER' || authUser.role === 'ADMIN') && (
                    <Link className="text-light text-decoration-none small hover-link" to="/manage-products">
                      Manage Products
                    </Link>
                  )}
                  
                  {/* Clean Profile Link Placement */}
                  <Link className="text-light text-decoration-none small hover-link" to="/profile">
                    Profile
                  </Link>
                  
                  {/* Orders Link Placement */}
                  <Link className="text-light text-decoration-none small hover-link" to="/orders">
                    Orders
                  </Link>

                  {/* Logout Action Widget */}
                  <button className="btn btn-outline-light btn-sm" onClick={logout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="btn btn-outline-light btn-sm px-3" to="/login">
                    Login
                  </Link>
                  <Link className="btn btn-light btn-sm px-3" to="/register">
                    Register
                  </Link>
                </>
              )}

              {/* Wishlist Link Widget */}
              <Link className="text-decoration-none d-flex align-items-center gap-1 text-light ms-2" to="/wishlist">
                <div className="position-relative d-inline-block">
                  <span style={{ fontSize: '1.2rem' }}>❤️</span>
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark fw-bold" style={{ fontSize: '9px' }}>
                    {wishlistCount}
                  </span>
                </div>
                <span className="small fw-medium ms-1">Wishlist</span>
              </Link>

              {/* Cart Widget */}
              <Link className="text-decoration-none d-flex align-items-center gap-1 text-light ms-2" to="/checkout">
                <div className="position-relative d-inline-block">
                  <span style={{ fontSize: '1.25rem' }}>🛒</span>
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                    {cartCount}
                  </span>
                </div>
                <span className="small fw-medium ms-1">Cart</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Category Ribbon Link Setup */}
      <div className="bg-white border-bottom py-2 shadow-sm d-none d-md-block">
        <div className="container">
          <div className="d-flex justify-content-center align-items-center gap-4 fw-medium" style={{ fontSize: '14px' }}>
            <NavLink className={({isActive}) => isActive ? "text-primary text-decoration-none fw-bold" : "text-dark text-decoration-none"} to="/">Home</NavLink>
            <Link className="text-dark text-decoration-none" to="/catalog">All Products</Link>
            <Link className="text-dark text-decoration-none" to="/catalog?search=Electronics">Electronics</Link>
            <Link className="text-dark text-decoration-none" to="/catalog?search=Wearables">Wearables</Link>
            <Link className="text-dark text-decoration-none" to="/catalog?search=Furniture">Furniture</Link>
            <Link className="text-dark text-decoration-none" to="/catalog?search=Accessories">Accessories</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;