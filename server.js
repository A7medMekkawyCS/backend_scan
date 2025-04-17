const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { errorHandler, enhanceResponse } = require('./middleware/errorMiddleware');
const User = require('./models/User');


const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Middleware to enhance response
app.use(enhanceResponse);

// Create admin if not exists
async function createAdminIfNotExists() {
  const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    const admin = new User({
      fullName: 'Admin User',
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
    });
    await admin.save();
    console.log('Admin account created.');
  }
}

createAdminIfNotExists();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
