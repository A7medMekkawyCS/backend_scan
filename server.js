const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const User = require('./models/User');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const viewAppointments = require('./routes/patient/bookAppointment');
const sendDiagnosisRoute = require('./routes/patient/sendDiagnosis');
const paymentRoutes = require('./routes/patient/paymentRoutes');
const doctorAppointments = require('./routes/doctor/doctorViewAppointments');
const doctorPayments = require('./routes/doctor/doctorViewPayments');
const doctorMessages = require('./routes/doctor/doctorViewMessages');
const createPdfReport = require('./routes/doctor/createPdfReport');
const viewReports = require('./routes/patient/viewReports');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use('/users', express.static('users')); 
app.use('/reports', express.static(path.join(__dirname, 'public/reports')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/upload', uploadRoutes);

// Patient specific routes
app.use('/api/patient/appointments', viewAppointments);
app.use('/api/patient/send-diagnosis', sendDiagnosisRoute);
app.use('/api/patient/payments', paymentRoutes);
app.use('/api/patient/reports', viewReports);

// Doctor specific routes
app.use('/api/doctor/appointments', doctorAppointments);
app.use('/api/doctor/payments', doctorPayments);
app.use('/api/doctor/messages', doctorMessages);
app.use('/api/doctor/reports', createPdfReport);

async function createAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin account already exists.');
    } else {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

      const adminUser = new User({
        fullName: process.env.ADMIN_NAME || 'Default Admin',
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('Admin created successfully.');
    }
  } catch (err) {
    console.error('Failed to create admin:', err.message);
  }
}

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');
    await createAdmin(); 
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
  });
