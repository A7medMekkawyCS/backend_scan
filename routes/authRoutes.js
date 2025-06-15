const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { generateToken, generateDoctorId, generatePatientId } = require('../utils/authUtils');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, mobilenumber, birthDate } = req.body;

    if (!fullName || !email || !password || !role || !mobilenumber || !birthDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    let doctorUserId = null;
    let patientUserId = null;
    let userRole = role;

    if (role === 'doctor') {
      doctorUserId = generateDoctorId();
      userRole = 'pending_doctor'; // Set as pending_doctor initially
    } else if (role === 'patient') {
      patientUserId = generatePatientId();
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: userRole,
      mobilenumber,
      birthDate,
      doctorUserId: role === 'doctor' ? doctorUserId : undefined,
      patientUserId: role === 'patient' ? patientUserId : undefined
    });

    res.status(201).json({
      message: role === 'doctor' ? 
        'Registration successful. Please wait for admin approval.' : 
        'User registered successfully',
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        userId: user.userId,
        doctorUserId: user.doctorUserId,
        patientUserId: user.patientUserId
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For doctors, check both User role and Doctor approval status
    if (user.role === 'pending_doctor' || user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      
      if (!doctor) {
        return res.status(403).json({ 
          message: 'Doctor profile not found. Please contact support.' 
        });
      }

      if (!doctor.isApproved) {
        return res.status(403).json({ 
          message: 'Your account is pending admin approval. Please wait for approval to access the system.' 
        });
      }

      // If doctor is approved, ensure user role is set to 'doctor'
      if (user.role !== 'doctor') {
        user.role = 'doctor';
        await user.save();
      }
    }

    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        userId: user.userId,
        doctorUserId: user.doctorUserId,
        patientUserId: user.patientUserId
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

module.exports = router;
