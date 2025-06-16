const express = require('express');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const router = express.Router();

// عرض جميع الدكاترة المعتمدين
router.get('/doctors', async (req, res) => {
  try {
    // البحث عن الدكاترة المعتمدين فقط
    const doctors = await Doctor.find({ isApproved: true })
      .populate('userId', 'fullName email profileImage');

    // تنسيق البيانات للعرض
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor._id,
      fullName: doctor.userId.fullName,
      email: doctor.userId.email,
      profileImage: doctor.userId.profileImage,
      specialization: doctor.specialization,
      experience: doctor.experience,
      qualifications: doctor.qualifications,
      hospital: doctor.hospital,
      contactNumber: doctor.contactNumber
    }));

    res.status(200).json({
      success: true,
      count: formattedDoctors.length,
      doctors: formattedDoctors
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// اختيار دكتور معين
router.post('/select-doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // البحث عن الدكتور المعتمد
    const doctor = await Doctor.findOne({ 
      _id: doctorId,
      isApproved: true 
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not approved'
      });
    }

    // تحديث معلومات المريض مع الدكتور المختار
    await User.findByIdAndUpdate(patientId, {
      selectedDoctor: doctorId
    });

    res.status(200).json({
      success: true,
      message: 'Doctor selected successfully',
      doctorId: doctor._id
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to select doctor',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// عرض تفاصيل دكتور معين
router.get('/doctors/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    // البحث عن الدكتور المعتمد
    const doctor = await Doctor.findOne({ 
      _id: doctorId,
      isApproved: true 
    }).populate('userId', 'fullName email profileImage');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not approved'
      });
    }

    // تنسيق بيانات الدكتور
    const formattedDoctor = {
      id: doctor._id,
      fullName: doctor.userId.fullName,
      email: doctor.userId.email,
      profileImage: doctor.userId.profileImage,
      specialization: doctor.specialization,
      experience: doctor.experience,
      qualifications: doctor.qualifications,
      hospital: doctor.hospital,
      contactNumber: doctor.contactNumber
    };

    res.status(200).json({
      success: true,
      doctor: formattedDoctor
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor details',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router; 