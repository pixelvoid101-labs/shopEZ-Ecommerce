const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Helper middleware to allow either Sellers or Admins
const verifySellerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'SELLER' || req.user.role === 'ADMIN')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Sellers or Admins only.' });
  }
};

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const { search, sellerMode } = req.query;
    let query = {};

    if (sellerMode === 'true' && req.headers.authorization) {
      if (req.query.sellerId) {
        query.sellerId = req.query.sellerId;
      }
    }

    if (search) {
      query.$and = [
        ...([query.sellerId] ? [{ sellerId: query.sellerId }] : []),
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ]
        }
      ];
      if (!query.sellerId) delete query.$and; 
      query = search && !query.sellerId ? {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]
      } : query;
    }

    const products = await Product.find(query).sort({ title: 1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

// CREATE NEW PRODUCT
router.post('/', verifyToken, verifySellerOrAdmin, async (req, res) => {
  try {
    const rawId = req.user?.id || req.user?._id;

    if (!rawId) {
      return res.status(400).json({ success: false, message: 'User identity payload missing from token context.' });
    }

    const parsedSellerId = new mongoose.Types.ObjectId(rawId);

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
    const brand = typeof req.body?.brand === 'string' ? req.body.brand.trim() : '';
    const image = typeof req.body?.image === 'string' ? req.body.image.trim() : '';

    const parsedPrice = Number(req.body?.price);
    const parsedDiscount = Number(req.body?.discount ?? 0);
    const parsedInventoryCount = Number(req.body?.inventoryCount);

    const images = Array.isArray(req.body?.images)
      ? req.body.images.filter(Boolean).map((url) => String(url).trim())
      : image
        ? [image]
        : [];

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, description, and category are required.' });
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
    }

    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      return res.status(400).json({ success: false, message: 'Discount must be between 0 and 100.' });
    }

    if (!Number.isFinite(parsedInventoryCount) || parsedInventoryCount < 0) {
      return res.status(400).json({ success: false, message: 'Inventory count must be a valid non-negative number.' });
    }

    const productData = {
      title,
      description,
      category,
      price: parsedPrice,
      discount: parsedDiscount,
      inventoryCount: parsedInventoryCount,
      brand,
      image,
      images,
      sellerId: parsedSellerId,
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    console.error('DATABASE SAVE ERROR:', error);

    if (error.name === 'ValidationError') {
      const validationMessages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: 'Product validation failed', errors: validationMessages });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product data format', error: error.message });
    }

    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
});

// UPDATE EXISTING PRODUCT
router.put('/:id', verifyToken, verifySellerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const currentUserId = req.user.id || req.user._id;

    // Enforcement security loop protecting asset nodes from unauthorized cross-account edits
    if (req.user.role === 'SELLER' && product.sellerId.toString() !== currentUserId?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized modification attempt.' });
    }

    // Force inject the verified authentic sellerId database state reference directly back into the update payload
    const updateData = {
      ...req.body,
      sellerId: product.sellerId 
    };

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
});

// DELETE PRODUCT WITH ORDER CANCELLATION CASCADE
router.delete('/:id', verifyToken, verifySellerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const currentUserId = req.user.id || req.user._id;

    if (req.user.role === 'SELLER' && product.sellerId.toString() !== currentUserId?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized erasure attempt.' });
    }

    await Product.findByIdAndDelete(req.params.id);

    const activeOrders = await Order.find({
      'items.product': req.params.id,
      status: { $in: ['Pending', 'Processing'] }
    });

    for (let order of activeOrders) {
      order.status = 'Cancelled';
      order.feedback = `The product "${product.title}" was removed by the seller. This order has been cancelled automatically.`;
      await order.save();
    }

    res.json({ 
      success: true, 
      message: 'Product permanently removed. Active orders containing this product have been cancelled.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
});

// GET SINGLE PRODUCT BY ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// SUBMIT PRODUCT REVIEW
router.post('/:id/reviews', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ success: false, message: 'Fields are required' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.reviews.push({
      user: req.user.email || 'Anonymous',
      rating: Number(rating),
      comment
    });
    
    await product.save();
    res.json({ success: true, message: 'Review added', product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit review', error: error.message });
  }
});

module.exports = router;