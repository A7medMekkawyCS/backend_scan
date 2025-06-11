const express = require('express');
const Appointment = require('../../models/Appointment');
const Payment = require('../../models/Payment');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');

const router = express.Router();

router.get(
  '/',
  authenticateUser,
  authorizeRole(['doctor']),
  async (req, res) => {
    try {
      // أول حاجة نجيب كل المواعيد الخاصة بالدكتور
      const appointments = await Appointment.find({ doctorId: req.user._id });
      const appointmentIds = appointments.map(app => app._id);

      // بعدين نجيب كل المدفوعات الخاصة بيهم
      const payments = await Payment.find({ appointmentId: { $in: appointmentIds } });

      res.status(200).json({
        success: true,
        payments,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
  }
);

module.exports = router;
