const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const User = require('./models/User'); // موديل المستخدم

// استدعاء الملفات
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use('/users', express.static('users')); // Serve static images

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/upload', uploadRoutes);

// 🟢 ✅ CREATE ADMIN ON SERVER START
async function createAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('✅ Admin account already exists.');
    } else {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

      const adminUser = new User({
        fullName: process.env.ADMIN_NAME || 'Default Admin',
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('🎉 Admin account created successfully.');
    }
  } catch (err) {
    console.error('❌ Failed to create admin:', err.message);
  }
}

// Connect to MongoDB & Start Server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    await createAdmin(); // استدعاء الدالة هنا
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
  });
