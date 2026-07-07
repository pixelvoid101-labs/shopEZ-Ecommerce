const mongoose = require('mongoose');
const Product = require('./models/Product');

(async () => {
  const product = new Product({
    title: 'T',
    description: 'short',
    price: 1,
    inventoryCount: 1,
    category: 'Electronics',
    sellerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
  });

  try {
    await product.validate();
    console.log('VALIDATION_OK');
  } catch (error) {
    console.log('VALIDATION_ERROR');
    console.log(error.message);
    console.log(Object.values(error.errors).map((err) => err.message).join(' | '));
  }
})();
