const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/authorizeRole");
const Diagnosis = require("../models/Diagnosis");
const Report = require("../models/Report");

const router = express.Router();

// عرض قائمة المرضى الذين لديهم تشخيصات
router.get("/patients", authenticateUser, authorizeRole(["doctor"]), async (req, res) => {
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

// إنشاء تقرير للمريض بعد التشخيص
router.post("/report/:diagnosisId", authenticateUser, authorizeRole(["doctor"]), async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    const { reportText } = req.body;

    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis) {
      return res.status(404).json({ message: "Diagnosis not found" });
    }

    const newReport = new Report({
      doctorId: req.user.userId,
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
        doctorUserId: req.user.userId,  // إضافة doctorUserId
        patientUserId: diagnosis.userId._id  // إضافة patientUserId
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// عرض تقرير مريض بناءً على معرف التشخيص
router.get("/report/:diagnosisId", authenticateUser, authorizeRole(["doctor", "patient"]), async (req, res) => {
  try {
    const { diagnosisId } = req.params;

    const report = await Report.findOne({ diagnosisId })
      .populate("doctorId", "fullName email")
      .populate("patientId", "fullName email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
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
