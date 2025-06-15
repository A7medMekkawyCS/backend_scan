const express = require("express");
const { authorizeRole } = require("../middleware/authorizeRole");
const { authenticateUser } = require("../middleware/authMiddleware");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

const router = express.Router();

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
    res.status(500).json({ message: "Server error" });
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
