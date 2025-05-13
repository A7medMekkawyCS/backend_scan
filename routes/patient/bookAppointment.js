const express = require('express');
const Appointment = require('../../models/Appointment');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');

const router = express.Router();

// حجز موعد مع الطبيب
router.post(
  '/',
  authenticateUser,
  authorizeRole(['patient']),
  async (req, res) => {
    try {
      const { doctorId, date, time } = req.body;

      if (!doctorId || !date || !time) {
        return res.status(400).json({
          success: false,
          message: 'doctorId, date, and time are required',
        });
      }

      const appointment = new Appointment({
        patientId: req.user._id,
        doctorId,
        date,
        time,
        status: 'pending', // أو confirmed/manual حسب اللوجيك اللي تحبه
      });

      await appointment.save();

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        appointment,
      });
    } catch (err) {
      console.error('Error booking appointment:', err);
      res.status(500).json({ success: false, message: 'Failed to book appointment' });
    }
  }
);

module.exports = router;
