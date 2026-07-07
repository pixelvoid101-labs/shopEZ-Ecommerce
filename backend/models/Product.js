const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: String, 
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  inventoryCount: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  image: {
    type: String,
    trim: true,
  },
  images: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviews: [reviewSchema]
});

productSchema.index({ title: 1, category: 1 });
productSchema.index({ category: 1 });
productSchema.index({ sellerId: 1 });

module.exports = mongoose.model('Product', productSchema);