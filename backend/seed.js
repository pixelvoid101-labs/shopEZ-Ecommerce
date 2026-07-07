const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Since seed.js is INSIDE the backend folder, .env is right next to it
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Since seed.js is INSIDE backend, models is just a folder up/next to it
const Product = require('./models/Product');

const sampleProducts = [
  {
    title: "Ergonomic Office Chair",
    category: "Furniture",
    description: "Adjustable lumbar support and breathable mesh for a better workday.",
    price: 12999,
    discount: 15,
    inventoryCount: 10,
    image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=400&q=80"
  },
  {
    title: "Minimalist Backpack",
    category: "Accessories",
    description: "Durable and lightweight backpack designed for daily travel.",
    price: 3499,
    discount: 12,
    inventoryCount: 15,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80"
  },
  {
    title: "Portable Blender",
    category: "Home",
    description: "Blend smoothies and shakes on the go with this compact device.",
    price: 2499,
    discount: 20,
    inventoryCount: 18,
    image: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&w=400&q=80"
  },
  {
    title: "Smart Fitness Watch",
    category: "Wearables",
    description: "Track your steps, heart rate, and workouts with a sleek design.",
    price: 5999,
    discount: 5,
    inventoryCount: 8,
    image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=400&q=80"
  }
];

const seedDatabase = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Shopez';
    
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected smoothly.');

    // Clear old products to avoid stacking duplicates
    await Product.deleteMany({});
    console.log('Cleared existing products in collection.');

    // Seed compliant records
    await Product.insertMany(sampleProducts);
    console.log('Successfully seeded items into database! 🚀');

    process.exit(0);
  } catch (error) {
    console.error('Seeding operation failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();