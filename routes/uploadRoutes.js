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
  limits: { fileSize: 5 * 1024 * 1024 } 
});

router.post('/', authenticateUser, authorizeRole(['patient']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const patientUserId = req.user.patientUserId;
    const imagePath = path.join('users', 'patients', patientUserId.toString(), req.file.filename);

    const imageUrl = `${process.env.BASE_URL}/${imagePath.replace(/\\/g, '/')}`;

    const predictionResponse = await axios.post(`${process.env.FLASK_SERVER_URL}/predict`, {
      imageUrl: imageUrl
    });

    const { confidence, predicted_label } = predictionResponse.data;

    const diagnosis = new Diagnosis({
      userId: req.user._id,
      imageUrl: imageUrl,
      result: predicted_label,
      confidence: confidence
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
});

module.exports = router;
