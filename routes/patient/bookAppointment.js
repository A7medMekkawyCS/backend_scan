const express = require('express');
const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');

const router = express.Router();

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

      const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }

      const appointment = new Appointment({
        patientId: req.user._id,
        doctorId: doctor._id,
        date,
        time,
        status: 'pending',
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
