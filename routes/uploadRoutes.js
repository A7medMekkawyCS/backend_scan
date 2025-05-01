const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const axios = require('axios');
const FormData = require('form-data');
const Diagnosis = require('../models/Diagnosis');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/authorizeRole');

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const patientUserId = req.user.patientUserId;

      if (!patientUserId) {
        return cb(new Error('User is not a patient or missing patient ID'));
      }

      const userDir = path.join(__dirname, '..', 'users', 'patients', patientUserId.toString());
      await fs.mkdir(userDir, { recursive: true });
      cb(null, userDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${timestamp}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Upload and diagnose route (for patients only)
router.post(
  '/',
  authenticateUser,
  authorizeRole(['patient']),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const patientUserId = req.user.patientUserId;
      const imagePath = path.join('users', 'patients', patientUserId.toString(), req.file.filename);

      const formData = new FormData();
      formData.append('image', await fs.readFile(req.file.path), {
        filename: req.file.filename,
        contentType: req.file.mimetype
      });
      let aiResponse;

if (process.env.USE_MOCK === 'true') {
  const hasCancer = Math.random() < 0.5;

  aiResponse = {
    data: {
      result: hasCancer
        ? "Possible indicators of cancer detected"
        : "No signs of cancer detected",
      confidence: parseFloat((Math.random() * (0.99 - 0.85) + 0.85).toFixed(2))
    }
  };
} else {
  aiResponse = await axios.post(process.env.AI_API_URL, formData, {
    headers: formData.getHeaders(),
    timeout: 30000
  });
}


     /*  const aiResponse = await axios.post(process.env.AI_API_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      }); */

      const diagnosis = new Diagnosis({
        userId: req.user._id,
        imageUrl: `${process.env.BASE_URL}/${imagePath.replace(/\\/g, '/')}`,
        result: aiResponse.data.result
      });

      await diagnosis.save();

      res.status(201).json({
        success: true,
        message: 'Image uploaded and diagnosed successfully',
        diagnosis
      });

    } catch (err) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      console.error('Upload error:', err);
      res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
    }
  }
);

module.exports = router;
