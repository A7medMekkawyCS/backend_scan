const express = require('express');
const User = require('../models/User');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/authorizeRole');
const router = express.Router();

// الموافقة على طبيب
router.post('/approve-doctor/:userId', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({ message: 'User is not a doctor' });
    }

    // التحقق من وجود الترخيص الطبي والتخصص
    if (!user.medicalLicense) {
      return res.status(400).json({ message: 'Medical license is required' });
    }

    if (!user.specialization) {
      return res.status(400).json({ message: 'Specialization is required' });
    }

    // تحديث حالة الموافقة
    user.verifiedAsDoctor = true;
    await user.save();

    res.status(200).json({ message: 'Doctor approved successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve doctor', error: err.message });
  }
});

// حذف مستخدم
router.delete('/delete-user/:userId', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // حذف المستخدم من قاعدة البيانات
    await user.remove();

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
});

// تحديث بيانات الطبيب
router.put('/update-doctor/:userId', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { specialization, medicalLicense } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found or not a doctor' });
    }

    // تحديث التخصص والترخيص الطبي
    if (specialization) user.specialization = specialization;
    if (medicalLicense) user.medicalLicense = medicalLicense;

    await user.save();

    res.status(200).json({ message: 'Doctor updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update doctor', error: err.message });
  }
});

module.exports = router;
