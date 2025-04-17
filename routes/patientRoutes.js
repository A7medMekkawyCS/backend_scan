const express = require('express');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/authorizeRole');
const Report = require('../models/Report');
const Diagnosis = require('../models/Diagnosis');
const router = express.Router();

router.get('/reports',
  authenticateUser,
  authorizeRole(['patient']),
  async (req, res) => {
    try {
      const reports = await Report.find({ patientId: req.user._id })
        .populate('doctorId', 'fullName specialization')
        .populate('diagnosisId', 'imageUrl result createdAt')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: reports.length,
        reports: reports.map(report => ({
          id: report._id,
          doctor: {
            name: report.doctorId.fullName,
            specialization: report.doctorId.specialization
          },
          diagnosis: {
            image: report.diagnosisId.imageUrl,
            aiResult: report.diagnosisId.result,
            date: report.diagnosisId.createdAt
          },
          reportText: report.reportText,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt
        }))
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

router.get('/reports/:id',
  authenticateUser,
  authorizeRole(['patient']),
  async (req, res) => {
    try {
      const report = await Report.findOne({
        _id: req.params.id,
        patientId: req.user._id
      })
        .populate('doctorId', 'fullName profileImage')
        .populate('diagnosisId');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      res.status(200).json({
        success: true,
        report: {
          id: report._id,
          doctor: {
            name: report.doctorId.fullName,
            avatar: report.doctorId.profileImage
          },
          diagnosis: {
            image: report.diagnosisId.imageUrl,
            aiResult: report.diagnosisId.result,
            date: report.diagnosisId.createdAt
          },
          reportText: report.reportText,
          createdAt: report.createdAt
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

router.get('/diagnoses',
  authenticateUser,
  authorizeRole(['patient']),
  async (req, res) => {
    try {
      const diagnoses = await Diagnosis.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .select('imageUrl result createdAt');

      const diagnosesWithReports = await Promise.all(
        diagnoses.map(async d => ({
          id: d._id,
          imageUrl: d.imageUrl,
          result: d.result,
          date: d.createdAt,
          hasReport: await Report.exists({ diagnosisId: d._id })
        }))
      );

      res.status(200).json({
        success: true,
        count: diagnoses.length,
        diagnoses: diagnosesWithReports
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch diagnoses',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

module.exports = router;
