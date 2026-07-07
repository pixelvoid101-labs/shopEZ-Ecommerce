const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Added to handle strict ObjectId type casting in aggregation filters
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { verifyToken, verifyAdmin, authenticateToken, isAdmin } = require('../middleware/auth');

// ==========================================
// TARGET MALFORMED/CORRUPTED ORDERS EXCLUSION MATRIX
// ==========================================
const EXCLUDED_ORDERS = ['6a4a30559515580573759cc1', '6a4a3b4b2702d08fea7fe323'];
const EXCLUDED_OBJECT_IDS = EXCLUDED_ORDERS.map(id => new mongoose.Types.ObjectId(id));

// ==========================================
// A. DASHBOARD METRICS AGGREGATOR
// ==========================================
router.get('/dashboard', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const categories = await Product.distinct('category');
    const paymentsCount = await Order.countDocuments({ _id: { $nin: EXCLUDED_ORDERS } });
    const users = await User.find().select('-password');

    res.json({
      success: true,
      stats: {
        usersCount,
        productsCount,
        categoriesCount: categories.length,
        paymentsCount
      },
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Dashboard generation failed' });
  }
});

// ==========================================
// 1. YOUR ORIGINAL OVERVIEW & ANALYTICS ENDPOINT
// ==========================================
router.get('/analytics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // A. Overview Counts Metrics (Excluding the malformed orders)
    const totalOrders = await Order.countDocuments({ _id: { $nin: EXCLUDED_ORDERS } });
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // B. Category array extraction
    const distinctCategories = await Product.distinct('category');
    const totalCategories = distinctCategories.length;

    // C. Revenue Aggregation (Exclude Cancelled orders & target bad orders)
    const dynamicRevenue = await Order.aggregate([
      { 
        $match: { 
          status: { $ne: 'Cancelled' },
          _id: { $nin: EXCLUDED_OBJECT_IDS } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const dailyRevenue = dynamicRevenue.length > 0 ? dynamicRevenue[0].total : 0;

    // D. Fetch fully populated datasets for the management tabs
    const usersList = await User.find({}, '-password').sort({ createdAt: -1 });
    const rawOrders = await Order.find({ _id: { $nin: EXCLUDED_ORDERS } })
      .populate('items.product', 'title price image category')
      .populate('user', 'name email')
      .sort({ timestamp: -1 });

    // Filter out "Ghost" orders where product/user references are broken
    const ordersList = rawOrders.filter(order =>
      order.user !== null &&
      order.items.every(item => item.product !== null)
    );

    // E. Calculate Payment Distribution Totals dynamically across database invoices
    const paymentAggregation = await Order.aggregate([
      { 
        $match: { 
          status: { $ne: 'Cancelled' },
          _id: { $nin: EXCLUDED_OBJECT_IDS }
        } 
      },
      { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' } } }
    ]);

    const paymentsBreakdown = { COD: 0, Card: 0, UPI: 0 };
    paymentAggregation.forEach(bucket => {
      if (bucket._id in paymentsBreakdown) {
        paymentsBreakdown[bucket._id] = bucket.total;
      }
    });

    res.json({
      success: true,
      metrics: {
        totalOrders,
        totalUsers,
        totalProducts,
        totalCategories,
        dailyRevenue
      },
      users: usersList,
      orders: ordersList,
      payments: paymentsBreakdown,
      categories: distinctCategories
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Administrative dataset aggregation failure', error: error.message });
  }
});

// ==========================================
// 2. USER DELETION HANDLER
// ==========================================
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;

    await User.findByIdAndDelete(targetId);
    await Product.deleteMany({ sellerId: targetId });
    await Order.deleteMany({ userId: targetId });

    res.json({ success: true, message: 'User and all associated data deleted entirely.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to erase user.' });
  }
});

// ==========================================
// 3. YOUR ORIGINAL ORDER PROGRESS STATUS ENDPOINT
// ==========================================
router.put('/orders/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStages = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    
    if (!validStages.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid target delivery status stage option string provided.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Target order record not found.' });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, message: `Order lifecycle status successfully updated to "${status}".`, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Status evolution transition failed', error: error.message });
  }
});

// ==========================================
// 4. NEW FEATURE: ADD NEW CATEGORY
// ==========================================
router.post('/categories', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { categoryName } = req.body;
    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ success: false, message: 'Category name cannot be blank.' });
    }

    const normalized = categoryName.trim();
    const exists = await Product.findOne({ category: { $regex: new RegExp(`^${normalized}$`, 'i') } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'This item group classification already exists.' });
    }

    const placeholderProduct = new Product({
      title: `Placeholder (${normalized})`,
      description: `System placeholder definition for category creation indexing parameters.`,
      price: 0,
      inventoryCount: 0,
      category: normalized,
      sellerId: req.user.id || req.user._id
    });

    await placeholderProduct.save({ validateBeforeSave: false });
    res.status(201).json({ success: true, message: `Category "${normalized}" initialized successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save new category index.', error: error.message });
  }
});

// ==========================================
// 5. NEW FEATURE: EDIT/RENAME CATEGORY
// ==========================================
router.put('/categories/rename', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName || !newName.trim()) {
      return res.status(400).json({ success: false, message: 'Valid old and new classification fields are required.' });
    }

    const updateResult = await Product.updateMany(
      { category: oldName },
      { $set: { category: newName.trim() } }
    );

    res.json({ 
      success: true, 
      message: `Successfully renamed "${oldName}" to "${newName.trim()}" across ${updateResult.modifiedCount} item structures.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update catalog categories.', error: error.message });
  }
});

// ==========================================
// 6. NEW FEATURE: DELETE CATEGORY
// ==========================================
router.delete('/categories/:categoryName', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const targetCategory = req.params.categoryName;
    const dropSummary = await Product.deleteMany({ category: targetCategory });
    res.json({ 
      success: true, 
      message: `Category alignment eradicated permanently. Cleared out ${dropSummary.deletedCount} related item definitions.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear selected categories from system maps.', error: error.message });
  }
});

module.exports = router;