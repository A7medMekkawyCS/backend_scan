const express = require("express");
const { authorizeRole } = require("../middleware/authorizeRole");
const { authenticateUser } = require("../middleware/authMiddleware");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

const router = express.Router();

// عرض بيانات الدكتور
router.get("/profile", authenticateUser, authorizeRole(["doctor"]), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'fullName email profileImage');

    if (!doctor) {
      return res.status(404).json({ 
        message: "No medical information found" 
      });
    }

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor._id,
        fullName: doctor.userId.fullName,
        email: doctor.userId.email,
        profileImage: doctor.userId.profileImage,
        specialization: doctor.specialization,
        experience: doctor.experience,
        qualifications: doctor.qualifications,
        medicalLicense: doctor.medicalLicense,
        hospital: doctor.hospital,
        contactNumber: doctor.contactNumber,
        isApproved: doctor.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch doctor profile",
      error: error.message 
    });
  }
});

// تحديث بيانات الدكتور
router.put("/profile", authenticateUser, authorizeRole(["doctor"]), async (req, res) => {
  try {
    const {
      specialization,
      experience,
      qualifications,
      hospital,
      contactNumber
    } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ 
        message: "No medical information found" 
      });
    }

    // تحديث البيانات
    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = experience;
    if (qualifications) doctor.qualifications = qualifications;
    if (hospital) doctor.hospital = hospital;
    if (contactNumber) doctor.contactNumber = contactNumber;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      doctor: {
        id: doctor._id,
        specialization: doctor.specialization,
        experience: doctor.experience,
        qualifications: doctor.qualifications,
        hospital: doctor.hospital,
        contactNumber: doctor.contactNumber
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Failed to update profile",
      error: error.message 
    });
  }
});

// Submit medical information
router.post("/submit-medical-info", async (req, res) => {
  try {
    const {
      userId,
      specialization,
      experience,
      qualifications,
      medicalLicense,
      hospital,
      contactNumber
    } = req.body;

    // Validate required fields
    if (!userId || !specialization || !experience || !qualifications || !medicalLicense || !hospital || !contactNumber) {
      return res.status(400).json({ 
        message: "All fields are required",
        requiredFields: {
          userId: "User ID is required",
          specialization: "Specialization is required",
          experience: "Experience is required",
          qualifications: "Qualifications are required",
          medicalLicense: "Medical license is required",
          hospital: "Hospital is required",
          contactNumber: "Contact number is required"
        }
      });
    }

    // Check if user exists and is a doctor
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found. Please make sure you have registered first." 
      });
    }

    if (user.role !== 'doctor' && user.role !== 'pending_doctor') {
      return res.status(403).json({ 
        message: "Only doctors can submit medical information" 
      });
    }

    // Check if doctor already has submitted information
    const existingDoctor = await Doctor.findOne({ userId });
    if (existingDoctor) {
      return res.status(400).json({ 
        message: "You have already submitted your medical information" 
      });
    }

    const doctor = new Doctor({
      userId,
      specialization,
      experience,
      qualifications,
      medicalLicense,
      hospital,
      contactNumber,
      isApproved: false
    });

    await doctor.save();

    res.status(201).json({
      message: "Medical information submitted successfully. Waiting for admin approval.",
      doctor: {
        specialization: doctor.specialization,
        experience: doctor.experience,
        qualifications: doctor.qualifications,
        medicalLicense: doctor.medicalLicense,
        hospital: doctor.hospital,
        contactNumber: doctor.contactNumber,
        status: "Pending Approval"
      }
    });
  } catch (error) {
    console.error("Error submitting medical info:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});

// Get doctor's medical information
router.get("/medical-info", authenticateUser, authorizeRole(["doctor"]), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });

    if (!doctor) {
      return res.status(404).json({ 
        message: "No medical information found. Please submit your medical information first." 
      });
    }

    res.json({
      specialization: doctor.specialization,
      experience: doctor.experience,
      qualifications: doctor.qualifications,
      medicalLicense: doctor.medicalLicense,
      hospital: doctor.hospital,
      contactNumber: doctor.contactNumber
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
