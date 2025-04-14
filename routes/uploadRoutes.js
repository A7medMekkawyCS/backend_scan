const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const axios = require('axios');
const FormData = require('form-data');
const Diagnosis = require('../models/Diagnosis');
const { authenticateUser } = require('../middleware/authMiddleware');
const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.user.userId; 
      const userDir = path.join('users', 'patients', userId.toString());
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

router.post('/diagnosis', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const imagePath = path.join('users', 'patients', userId.toString(), req.file.filename);

    const formData = new FormData();
    formData.append('image', await fs.readFile(imagePath), {
      filename: req.file.filename,
      contentType: req.file.mimetype
    });

    const aiResponse = await axios.post(process.env.AI_API_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    const diagnosis = new Diagnosis({
      userId: req.user._id,
      userNumericId: req.user.userId,
      imageUrl: imagePath,
      result: aiResponse.data.result
    });

    await diagnosis.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      diagnosis
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
