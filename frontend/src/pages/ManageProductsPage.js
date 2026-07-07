import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ManageProductsPage = () => {
  const { authUser, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    discount: 0,
    inventoryCount: 1,
    brand: '',
    image: '',
    imageUrl2: '',
    imageUrl3: ''
  });

  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products', getAuthHeaders());
      if (response.data.success) {
        if (authUser?.role === 'ADMIN') {
          setProducts(response.data.products);
        } else {
          const loggedInUserId = authUser?.id || authUser?._id;
          const sellerItems = response.data.products.filter(p => 
            p.sellerId?.toString() === loggedInUserId?.toString()
          );
          setProducts(sellerItems);
        }
      }
    } catch (err) {
      console.error('Error fetching inventory catalog items:', err);
    }
  }, [authUser, getAuthHeaders]);

  useEffect(() => {
    if (authUser) {
      fetchProducts();
    }
  }, [authUser, fetchProducts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: '',
      price: 0,
      discount: 0,
      inventoryCount: 1,
      brand: '',
      image: '',
      imageUrl2: '',
      imageUrl3: ''
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    const title = form.title.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const discount = Number(form.discount);
    const inventoryCount = Number(form.inventoryCount);

    if (!title || title.length < 2) {
      setMessage({ text: 'Title must be at least 2 characters long.', type: 'danger' });
      return;
    }

    if (!description || description.length < 10) {
      setMessage({ text: 'Description must be at least 10 characters long.', type: 'danger' });
      return;
    }

    if (!category) {
      setMessage({ text: 'Please select a category.', type: 'danger' });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setMessage({ text: 'Price must be a valid non-negative number.', type: 'danger' });
      return;
    }

    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setMessage({ text: 'Discount must be between 0 and 100.', type: 'danger' });
      return;
    }

    if (!Number.isFinite(inventoryCount) || inventoryCount < 0) {
      setMessage({ text: 'Stock must be a valid non-negative number.', type: 'danger' });
      return;
    }

    // Identify current user identity matching context hooks safely
    const currentUserId = authUser?.id || authUser?._id;

    // Build payload object ensuring sellerId path parameter satisfies strict validation rules
    const payload = {
      title,
      description,
      category,
      price,
      discount,
      inventoryCount,
      brand: form.brand.trim(),
      image: form.image.trim(),
      images: [form.image, form.imageUrl2, form.imageUrl3].filter(url => url !== '').map(url => url.trim()),
      // Preserve existing seller ID if editing, otherwise assign the currently logged in user
      sellerId: isEditing 
        ? products.find(p => p._id === editId)?.sellerId 
        : currentUserId
    };

    try {
      if (isEditing) {
        const res = await axios.put(`http://localhost:5000/api/products/${editId}`, payload, getAuthHeaders());
        if (res.data.success) {
          setMessage({ text: 'Product updated successfully!', type: 'success' });
          resetForm();
        }
      } else {
        const res = await axios.post('http://localhost:5000/api/products', payload, getAuthHeaders());
        if (res.data.success) {
          setMessage({ text: 'Product posted successfully!', type: 'success' });
          resetForm();
        }
      }
      fetchProducts();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Transaction submission error', type: 'danger' });
    }
  };

  const handleEditInit = (product) => {
    setIsEditing(true);
    setEditId(product._id);
    setForm({
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      discount: product.discount || 0,
      inventoryCount: product.inventoryCount,
      brand: product.brand || '',
      image: product.image || '',
      imageUrl2: product.images?.[1] || '',
      imageUrl3: product.images?.[2] || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you completely sure? Removing this product will cancel any active pending customer orders for it.')) {
      try {
        const res = await axios.delete(`http://localhost:5000/api/products/${id}`, getAuthHeaders());
        if (res.data.success) {
          setMessage({ text: res.data.message, type: 'warning' });
          fetchProducts();
          if (editId === id) resetForm();
        }
      } catch (err) {
        setMessage({ text: 'Failed to process product deletion cascade.', type: 'danger' });
      }
    }
  };

  return (
    <div className="container py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="mb-4">
        <h2 className="fw-bold text-dark m-0">Product Management</h2>
        <p className="text-muted small">Add or update products available through your seller/admin account.</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
        </div>
      )}

      <div className="row g-4">
        {/* Left Input Form Panel */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '12px' }}>
            <h4 className="fw-bold mb-4 text-dark">{isEditing ? 'Modify product entry' : 'Add new product'}</h4>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-medium text-secondary">Title</label>
                <input className="form-control" name="title" value={form.title} onChange={handleInputChange} required />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-medium text-secondary">Description</label>
                <textarea className="form-control" name="description" rows="3" value={form.description} onChange={handleInputChange} required />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-medium text-secondary">Category</label>
                <select className="form-select" name="category" value={form.category} onChange={handleInputChange} required>
                  <option value="">Select category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Wearables">Wearables</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-medium text-secondary">Price (₹)</label>
                  <input type="number" className="form-control" name="price" value={form.price} onChange={handleInputChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-medium text-secondary">Discount (%)</label>
                  <input type="number" className="form-control" name="discount" value={form.discount} onChange={handleInputChange} />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-medium text-secondary">Stock</label>
                  <input type="number" className="form-control" name="inventoryCount" value={form.inventoryCount} onChange={handleInputChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-medium text-secondary">Brand</label>
                  <input className="form-control" name="brand" value={form.brand} onChange={handleInputChange} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-medium text-secondary">Image URLs</label>
                <input className="form-control mb-2" name="image" placeholder="Main image URL" value={form.image} onChange={handleInputChange} required />
                <input className="form-control mb-2" name="imageUrl2" placeholder="Second image URL" value={form.imageUrl2} onChange={handleInputChange} />
                <input className="form-control" name="imageUrl3" placeholder="Third image URL" value={form.imageUrl3} onChange={handleInputChange} />
              </div>

              <div className="d-flex gap-2 pt-2">
                <button type="submit" className="btn btn-primary px-4 w-50 fw-medium" style={{ borderRadius: '8px' }}>
                  {isEditing ? 'Save Changes' : 'Add product'}
                </button>
                <button type="button" className="btn btn-light px-4 w-50 fw-medium text-dark border" onClick={resetForm} style={{ borderRadius: '8px' }}>
                  New product
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Product Listing Panel */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '12px' }}>
            <div className="mb-3">
              <h4 className="fw-bold m-0 text-dark">My Listings</h4>
              <span className="text-muted small">{products.length} products total</span>
            </div>

            <div className="overflow-auto" style={{ maxHeight: '680px' }}>
              {products.length === 0 ? (
                <p className="text-muted py-4 text-center">No active listings posted yet under this user account.</p>
              ) : (
                products.map((product) => (
                  <div key={product._id} className="d-flex align-items-center justify-content-between p-3 mb-2 border-bottom hover-bg-light">
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">{product.title}</h6>
                      <div className="text-muted small">
                        ₹{product.price} • <span className="fw-medium text-secondary">Stock: {product.inventoryCount}</span>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-light border px-3 text-dark fw-medium" onClick={() => handleEditInit(product)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger px-3 fw-medium" onClick={() => handleDelete(product._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageProductsPage;