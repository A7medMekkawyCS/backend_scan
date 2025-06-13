const express = require('express');
const Diagnosis = require('../../models/Diagnosis');
const Message = require('../../models/Message');
const Report = require('../../models/Report');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');

const router = express.Router();

// Base URL for Railway deployment
const BASE_URL = 'https://backendscan-production.up.railway.app';

// Send diagnosis to doctor
router.post(
  '/',
  authenticateUser,
  authorizeRole(['patient']),
  async (req, res) => {
    try {
      const { doctorId, diagnosisId, messageText } = req.body;

      if (!doctorId || !diagnosisId || !messageText) {
        return res.status(400).json({
          success: false,
          message: 'doctorId, diagnosisId, and messageText are required',
        });
      }

      const diagnosis = await Diagnosis.findById(diagnosisId);
      if (!diagnosis) {
        return res.status(404).json({ success: false, message: 'Diagnosis not found' });
      }

      const message = new Message({
        from: req.user._id,
        to: doctorId,
        diagnosisId,
        text: messageText,
      });

      await message.save();

      res.status(201).json({
        success: true,
        message: 'Diagnosis sent to doctor successfully',
        data: {
          ...message.toObject(),
          reportUrl: `${BASE_URL}/api/patient/reports/${message._id}`,
          diagnosisUrl: `${BASE_URL}/api/patient/diagnosis/${diagnosisId}`
        }
      });
    } catch (err) {
      console.error('Error sending diagnosis:', err);
      res.status(500).json({ success: false, message: 'Failed to send diagnosis' });
    }
  }
);

// Get patient's reports
router.get('/reports', authenticateUser, authorizeRole(['patient']), async (req, res) => {
  try {
    const reports = await Report.find({ patientId: req.user._id })
      .populate('doctorId', 'fullName specialization')
      .populate('diagnosisId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports: reports.map(report => ({
        id: report._id,
        doctor: {
          name: report.doctorId.fullName,
          specialization: report.doctorId.specialization
        },
        diagnosis: {
          image: report.diagnosisId.imageUrl,
          result: report.diagnosisId.result,
          date: report.diagnosisId.createdAt
        },
        reportText: report.reportText,
        doctorNotes: report.doctorNotes,
        pdfUrl: report.pdfUrl ? `${BASE_URL}${report.pdfUrl}` : null,
        status: report.status,
        createdAt: report.createdAt,
        reportUrl: `${BASE_URL}/api/patient/reports/${report._id}`
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// Get single report
router.get('/reports/:reportId', authenticateUser, authorizeRole(['patient']), async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.reportId,
      patientId: req.user._id
    })
    .populate('doctorId', 'fullName specialization')
    .populate('diagnosisId');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({
      success: true,
      report: {
        id: report._id,
        doctor: {
          name: report.doctorId.fullName,
          specialization: report.doctorId.specialization
        },
        diagnosis: {
          image: report.diagnosisId.imageUrl,
          result: report.diagnosisId.result,
          date: report.diagnosisId.createdAt
        },
        reportText: report.reportText,
        doctorNotes: report.doctorNotes,
        pdfUrl: report.pdfUrl ? `${BASE_URL}${report.pdfUrl}` : null,
        status: report.status,
        createdAt: report.createdAt,
        reportUrl: `${BASE_URL}/api/patient/reports/${report._id}`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
});

module.exports = router;
