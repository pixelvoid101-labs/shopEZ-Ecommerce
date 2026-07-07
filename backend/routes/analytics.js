const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// 1. GET COMPLETE DASHBOARD METRICS MAP (Overview, Users, Orders, Payments, Categories)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Gather all underlying data pools concurrently
    const allOrders = await Order.find()
      .populate('user', 'name email role')
      .populate('items.product', 'title price category')
      .sort({ timestamp: -1 });

    const allUsers = await User.find({}, '-password').sort({ createdAt: -1 });
    const allProducts = await Product.find({}, 'category');

    // Calculate Financial Aggregations
    let grossRevenue = 0;
    const paymentMetrics = { COD: 0, Card: 0, UPI: 0 };
    
    allOrders.forEach(order => {
      if (order.status !== 'Cancelled') {
        grossRevenue += order.totalAmount || 0;
        if (paymentMetrics[order.paymentMethod] !== undefined) {
          paymentMetrics[order.paymentMethod] += order.totalAmount || 0;
        }
      }
    });

    // Extract dynamic unique categories directly from live products
    const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

    res.json({
      success: true,
      metrics: {
        totalOrders: allOrders.length,
        totalUsers: allUsers.length,
        totalCategories: uniqueCategories.length,
        dailyRevenue: grossRevenue
      },
      users: allUsers,
      orders: allOrders,
      payments: paymentMetrics,
      categories: uniqueCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to aggregate admin dashboard parameters.',
      error: error.message,
    });
  }
});

// 2. UPDATE ORDER LIFECYCLE TRACKING STAGE (Propagates status across entire site)
router.put('/orders/:orderId/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStages = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStages.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order tracking state choice.' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Target order context record not found.' });
    }

    res.json({ success: true, message: `Fulfillment stage shifted to "${status}" successfully.`, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to transform status lifecycle.', error: error.message });
  }
});

// 3. EJECT USER ACCOUNT PERMANENTLY FROM WEBSITE SYSTEM
router.delete('/users/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const target = req.params.userId;
    const selfId = req.user.id || req.user._id;

    if (target === selfId.toString()) {
      return res.status(400).json({ success: false, message: 'Self-destruction guard: You cannot delete your own admin profile.' });
    }

    const deletedUser = await User.findByIdAndDelete(target);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'Target profile node not found.' });
    }

    res.json({ success: true, message: `Account entry for ${deletedUser.name} removed from database registry.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user profile.', error: error.message });
  }
});

module.exports = router;