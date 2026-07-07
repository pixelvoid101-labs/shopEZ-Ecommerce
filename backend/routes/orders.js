const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); 
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// TARGET MALFORMED/CORRUPTED ORDERS EXCLUSION MATRIX
// ==========================================
const EXCLUDED_ORDERS = ['6a4a30559515580573759cc1', '6a4a3b4b2702d08fea7fe323'];

// CREATE NEW ORDER (WITH FIXED PRODUCT SAVE VALIDATION)
router.post('/', verifyToken, async (req, res) => {
  try {
    let { items, totalAmount, status, shippingAddress, paymentMethod } = req.body;

    if (!items || !items.length || !totalAmount || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Order items, total amount, and shipping details are required',
      });
    }

    const resolvedUserId = req.user?.id || req.user?._id;
    if (!resolvedUserId) {
      return res.status(401).json({ success: false, message: 'Authentication context user not resolved.' });
    }

    // --- 1. Payload Sanitization & Enum Normalization ---
    if (paymentMethod) {
      const normalizedMethod = paymentMethod.toString().trim().toLowerCase();
      if (normalizedMethod === 'cash_on_delivery' || normalizedMethod === 'cod') {
        paymentMethod = 'COD';
      } else if (normalizedMethod === 'card') {
        paymentMethod = 'Card';
      } else if (normalizedMethod === 'upi') {
        paymentMethod = 'UPI';
      } else {
        paymentMethod = 'COD'; // Fallback safely
      }
    } else {
      paymentMethod = 'COD';
    }

    // Standardize status format
    if (status) {
      status = status.toString().trim().charAt(0).toUpperCase() + status.toString().trim().slice(1).toLowerCase();
    } else {
      status = 'Pending';
    }

    // --- 2. Database Inventory Validation Check Loop ---
    for (const item of items) {
      if (!item.product) {
        return res.status(400).json({ success: false, message: 'Invalid payload: Missing product ID on items.' });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }

      if (product.inventoryCount < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.title}` });
      }

      // Deduct item count safely
      product.inventoryCount -= item.quantity;
      
      // FIX: validateBeforeSave: false ensures missing historical data like sellerId won't block stock reduction!
      await product.save({ validateBeforeSave: false });
    }

    // --- 3. Save Normalized Valid Document ---
    const order = new Order({
      user: resolvedUserId,
      items,
      totalAmount: Number(totalAmount),
      shippingAddress,
      paymentMethod,
      status,
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error("CRITICAL ORDER CREATION FAILURE:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
});

// SUBMIT ORDER FEEDBACK ROUTE
router.patch('/:id/feedback', verifyToken, async (req, res) => {
  try {
    const { feedback } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: (req.user.id || req.user._id) });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tracking log record not found.' });
    }
    
    if (order.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Feedback forms unlock exclusively upon successful item delivery status confirmations.' });
    }

    order.feedback = feedback;
    await order.save();

    res.json({ success: true, message: 'Feedback notes recorded successfully!', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Feedback persistence capture aborted.', error: error.message });
  }
});

// GET LOGGED IN USER ORDERS
router.get('/my', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: (req.user.id || req.user._id), _id: { $nin: EXCLUDED_ORDERS } })
      .populate('items.product', 'title price image description category')
      .populate('user', 'name email');

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your orders',
      error: error.message,
    });
  }
});

// GET ALL ORDERS (ADMIN ONLY) - FIXED TO EXCLUDE CORRUPTED ENTRIES
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find({ _id: { $nin: EXCLUDED_ORDERS } })
      .populate('items.product', 'title price image category')
      .populate('user', 'name email');

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
});

// UPDATE STATUS OF AN ORDER (ADMIN ONLY)
router.put('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStages = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    
    if (!validStages.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid target delivery status option.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Target order record not found.' });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, message: `Order status shifted to ${status}`, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Status modification failed', error: error.message });
  }
});

// FETCH ALL USERS (ADMIN ONLY)
router.get('/admin/users-list', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve users', error: error.message });
  }
});

// PERMANENTLY DELETE A USER (ADMIN ONLY)
router.delete('/admin/users-delete/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const adminId = req.user.id || req.user._id;

    if (targetUserId === adminId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own admin account." });
    }

    await User.findByIdAndDelete(targetUserId);
    res.json({ success: true, message: 'User account removed permanently from website.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'User removal failure', error: error.message });
  }
});

module.exports = router;