const express = require('express');
const Diagnosis = require('../../models/Diagnosis');
const Message = require('../../models/Message');
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
      const { doctorId, diagnosisId, messageText } = req.body;

      if (!doctorId || !diagnosisId || !messageText) {
        return res.status(400).json({
          success: false,
          message: 'doctorId, diagnosisId, and messageText are required',
        });
      }

      const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found or not approved',
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
        data: message,
      });
    } catch (err) {
      console.error('Error sending diagnosis:', err);
      res.status(500).json({ success: false, message: 'Failed to send diagnosis' });
    }
  }
);

module.exports = router;
