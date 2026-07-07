const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  dailyRevenue: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0,
  },
  topSellingProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
});

module.exports = mongoose.model('Analytics', analyticsSchema);
