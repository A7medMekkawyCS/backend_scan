const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
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

    if (role === 'doctor') {
      doctorUserId = generateDoctorId(); 
    } else if (role === 'patient') {
      patientUserId = generatePatientId();
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      mobilenumber,
      birthDate,
      doctorUserId: role === 'doctor' ? doctorUserId : undefined,
      patientUserId: role === 'patient' ? patientUserId : undefined
    });

    res.status(201).json({
      message: 'User registered successfully',
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
