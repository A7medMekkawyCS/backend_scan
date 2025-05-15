const express = require("express");
const { authorizeRole } = require("../middleware/authorizeRole");
const Diagnosis = require("../models/Diagnosis");
const Report = require("../models/Report");

const router = express.Router();

// الحصول على جميع التشخيصات للمريض (للطبيب فقط)
router.get("/patients", authorizeRole(["doctor"]), async (req, res) => {
  try {
    const diagnoses = await Diagnosis.find().populate("userId", "fullName email");

    res.json(diagnoses.map(diagnosis => ({
      id: diagnosis._id,
      patient: {
        fullName: diagnosis.userId.fullName,
        email: diagnosis.userId.email
      },
      diagnosis: {
        imageUrl: diagnosis.imageUrl,
        result: diagnosis.result,
        date: diagnosis.createdAt
      },
      patientUserId: diagnosis.userId._id // إضافة patientUserId
    })));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// إضافة تقرير جديد (للطبيب فقط)
router.post("/report/:diagnosisId", authorizeRole(["doctor"]), async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    const { reportText, doctorUserId } = req.body;  

    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis) {
      return res.status(404).json({ message: "Diagnosis not found" });
    }

    const newReport = new Report({
      doctorId: doctorUserId,  
      patientId: diagnosis.userId,
      diagnosisId,
      reportText,
    });

    await newReport.save();
    res.status(201).json({
      message: "Report added successfully",
      report: {
        id: newReport._id,
        reportText: newReport.reportText,
        createdAt: newReport.createdAt,
        doctorUserId,  
        patientUserId: diagnosis.userId._id  
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/report/:diagnosisId", authorizeRole(["doctor", "patient"]), async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    const { userId } = req.body;  

    const report = await Report.findOne({ diagnosisId })
      .populate("doctorId", "fullName email")
      .populate("patientId", "fullName email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.patientId._id.toString() !== userId && report.doctorId._id.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: You are not authorized to access this report" });
    }

    res.json({
      id: report._id,
      reportText: report.reportText,
      createdAt: report.createdAt,
      doctor: {
        fullName: report.doctorId.fullName,
        email: report.doctorId.email
      },
      patient: {
        fullName: report.patientId.fullName,
        email: report.patientId.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
