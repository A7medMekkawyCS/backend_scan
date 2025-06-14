// 📁 routes/patient/viewReports.js

const express = require('express');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');
const Report = require('../../models/Report');

const router = express.Router();

router.get(
  '/view-reports',
  authenticateUser,
  authorizeRole(['patient']),
  async (req, res) => {
    try {
      const reports = await Report.find({ patientId: req.user._id }).populate('doctorId', 'fullName email');

      const baseUrl = process.env.BASE_URL || 'http://localhost:9000';

      const formattedReports = reports.map(report => {
        const filePath = report.filePath.replace(/\\/g, '/');
        return {
          _id: report._id,
          description: report.description,
          doctor: report.doctorId,
          date: report.date,
          fileUrl: `${baseUrl}/${filePath}`
        };
      });

      res.status(200).json({
        success: true,
        reports: formattedReports
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
  }
);

module.exports = router;
