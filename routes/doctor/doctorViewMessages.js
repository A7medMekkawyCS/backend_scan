const express = require('express');
const Message = require('../../models/Message');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');

const router = express.Router();

router.get(
  '/',
  authenticateUser,
  authorizeRole(['doctor']),
  async (req, res) => {
    try {
      // نستخدم معرف المستخدم مباشرة لأن دوره دكتور
      const messages = await Message.find({ to: req.user._id }).populate('diagnosisId');
      res.status(200).json({
        success: true,
        messages,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
  }
);

module.exports = router;
