const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/authorizeRole');
const router = express.Router();

// Get all pending doctor requests
router.get('/pending-doctors', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const doctors = await Doctor.find({ isApproved: false })
      .populate('userId', 'fullName email');
    
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending doctors', error: err.message });
  }
});

// Approve doctor request
router.post('/approve-doctor/:doctorId', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isApproved = true;
    await doctor.save();

    // Update user role to doctor if not already
    const user = await User.findById(doctor.userId);
    if (user && user.role !== 'doctor') {
      user.role = 'doctor';
      await user.save();
    }

    res.status(200).json({ 
      message: 'Doctor approved successfully',
      doctor: {
        id: doctor._id,
        specialization: doctor.specialization,
        medicalLicense: doctor.medicalLicense,
        hospital: doctor.hospital,
        isApproved: doctor.isApproved
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve doctor', error: err.message });
  }
});

// Reject doctor request
router.post('/reject-doctor/:doctorId', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await Doctor.findByIdAndDelete(doctorId);

    res.status(200).json({ message: 'Doctor request rejected successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject doctor', error: err.message });
  }
});

// Get all approved doctors
router.get('/approved-doctors', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const doctors = await Doctor.find({ isApproved: true })
      .populate('userId', 'fullName email');
    
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch approved doctors', error: err.message });
  }
});

router.delete('/delete-user/:userId', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.remove();

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
});

router.put('/update-doctor/:userId', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { specialization, medicalLicense } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found or not a doctor' });
    }

    if (specialization) user.specialization = specialization;
    if (medicalLicense) user.medicalLicense = medicalLicense;

    await user.save();

    res.status(200).json({ message: 'Doctor updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update doctor', error: err.message });
  }
});

module.exports = router;
