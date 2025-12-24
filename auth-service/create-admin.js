#!/usr/bin/env node
const mongoose = require('mongoose');

require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb-auth:27017/auth_db';

async function createAdmin() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const User = require('./src/models/User');

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@healthcure.com' });
    
    if (adminExists) {
      console.log('⏭️  Admin user sudah ada, skip.');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const admin = new User({
      email: 'admin@healthcure.com',
      phone: '081234567890',
      password: 'admin123',
      name: 'Administrator',
      role: 'admin',
      isVerified: true,
      patientId: null
    });

    await admin.save();

    console.log('✅ Admin user berhasil dibuat!');
    console.log('📧 Email: admin@healthcure.com');
    console.log('🔐 Password: admin123');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
