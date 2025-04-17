const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/authUtils');
const { generateDoctorId, generatePatientId } = require('../utils/authUtils');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, mobilenumber, birthDate } = req.body;

    if (!fullName || !email || !password || !role || !mobilenumber || !birthDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const lastUser = await User.findOne().sort({ userId: -1 });
    const userId = lastUser ? lastUser.userId + 1 : 1;

    let doctorUserId, patientUserId;
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
      userId,
      doctorUserId,
      patientUserId
    });

    res.status(201).json({
      message: 'User registered',
      token: generateToken(user._id, user.role, user.userId),
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

    res.json({
      message: 'Login successful',
      token: generateToken(user._id, user.role, user.userId),
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
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
