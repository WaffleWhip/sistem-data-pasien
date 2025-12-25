#!/usr/bin/env node
const mongoose = require('mongoose');

require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb-auth:27017/auth_db';

// Retry connection function
const connectWithRetry = async (retries = 15, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[${i + 1}/${retries}] Connecting to MongoDB...`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 8000,
      });
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (err) {
      console.error(`❌ Attempt ${i + 1} failed: ${err.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Retry in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

async function createAdmin() {
  try {
    const connected = await connectWithRetry();
    
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB after multiple retries');
      process.exit(1);
    }

    const User = require('./src/models/User');

    // Check if admin exists
    let admin = await User.findOne({ email: 'admin@healthcure.com' });
    
    if (admin) {
      // Update existing admin password
      console.log('👤 Admin user sudah ada, updating password...');
      admin.password = 'admin123';
      admin.phone = null;  // Admin tidak perlu phone
      admin.isVerified = true;
      await admin.save();
      console.log('✅ Admin password berhasil di-update!');
    } else {
      // Create new admin user (phone not needed for admin)
      admin = new User({
        email: 'admin@healthcure.com',
        password: 'admin123',
        name: 'Administrator',
        role: 'admin',
        isVerified: true,
        patientId: null
      });

      await admin.save();
      console.log('✅ Admin user berhasil dibuat!');
    }

    console.log('📧 Email: admin@healthcure.com');
    console.log('🔐 Password: admin123');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
