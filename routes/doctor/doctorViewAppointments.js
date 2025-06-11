const express = require('express');
const Appointment = require('../../models/Appointment');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');

const router = express.Router();

router.get(
  '/',
  authenticateUser,
  authorizeRole(['doctor']),
  async (req, res) => {
    try {
      const appointments = await Appointment.find({ doctorId: req.user._id });
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
