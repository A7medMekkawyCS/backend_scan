const express = require('express');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const router = express.Router();

// عرض جميع الدكاترة المعتمدين
router.get('/doctors', async (req, res) => {
  try {
    // البحث عن المستخدمين الذين لديهم دور دكتور
    const doctors = await User.find({ role: 'doctor' })
      .select('_id fullName email profileImage');

    // البحث عن معلومات الدكاترة المعتمدين
    const approvedDoctors = await Doctor.find({ 
      isApproved: true,
      userId: { $in: doctors.map(d => d._id) }
    }).populate('userId', 'fullName email profileImage');

    // تنسيق البيانات للعرض
    const formattedDoctors = approvedDoctors.map(doctor => ({
      userId: doctor.userId._id, // معرف المستخدم الأصلي للدكتور
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
router.post('/select-doctor/:userId', async (req, res) => {
  try {
    const { userId } = req.params; // هذا هو _id من جدول User
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // التحقق من أن المستخدم دكتور معتمد
    const doctor = await Doctor.findOne({ 
      userId: userId,
      isApproved: true 
    }).populate('userId', 'fullName email profileImage');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not approved. You can only select approved doctors.'
      });
    }

    // التحقق من أن المستخدم مريض
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can select doctors'
      });
    }

    // تحديث معلومات المريض مع معرف المستخدم الأصلي للدكتور
    await User.findByIdAndUpdate(patientId, {
      selectedDoctor: userId // تخزين معرف المستخدم الأصلي للدكتور
    });

    // إرجاع معلومات الدكتور المختار
    res.status(200).json({
      success: true,
      message: 'Doctor selected successfully',
      selectedDoctor: {
        userId: doctor.userId._id,      // معرف المستخدم الأصلي للدكتور
        fullName: doctor.userId.fullName,
        email: doctor.userId.email,
        profileImage: doctor.userId.profileImage,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        contactNumber: doctor.contactNumber
      }
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
router.get('/doctors/:userId', async (req, res) => {
  try {
    const { userId } = req.params; // هذا هو _id من جدول User

    // البحث عن الدكتور المعتمد فقط
    const doctor = await Doctor.findOne({ 
      userId: userId,
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
      userId: doctor.userId._id, // معرف المستخدم الأصلي للدكتور
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