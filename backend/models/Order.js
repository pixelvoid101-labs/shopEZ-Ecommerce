const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' }
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Card', 'UPI'],
    default: 'COD',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], // Expanded stages support
    default: 'Pending',
  },
  feedback: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.index({ user: 1, timestamp: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);