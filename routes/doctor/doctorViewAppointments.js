const express = require('express');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');

const router = express.Router();

router.get(
  '/',
  authenticateUser,
  authorizeRole(['doctor']),
  async (req, res) => {
    try {
      // أولاً نجيب معرف الدكتور من جدول Doctor
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // نستخدم _id من جدول Doctor
      const appointments = await Appointment.find({ doctorId: doctor._id });
      res.status(200).json({
        success: true,
        appointments,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
    }
  }
);

module.exports = router;
