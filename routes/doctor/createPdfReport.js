const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');
const User = require('../../models/User');
const Diagnosis = require('../../models/Diagnosis');
const Report = require('../../models/Report');

const router = express.Router();

router.post(
  '/create-report',
  authenticateUser,
  authorizeRole(['doctor']),
  async (req, res) => {
    console.time('PDF Report Generation Request');
    try {
      const { diagnosisId, doctorNotes, reportText } = req.body;

      // 1. Get diagnosis and doctor
      console.time('DB Queries');
      const [diagnosis, doctor] = await Promise.all([
        Diagnosis.findById(diagnosisId).populate('userId'),
        User.findById(req.user._id)
      ]);
      console.timeEnd('DB Queries');

      if (!diagnosis) {
        console.timeEnd('PDF Report Generation Request');
        return res.status(404).json({ success: false, message: 'Diagnosis not found' });
      }

      const patient = diagnosis.userId;
      const doctorFolder = doctor.customId || `doctor-${doctor._id}`;
      const patientFolder = patient.customId || `patient-${patient._id}`;
      const fileName = `report_${Date.now()}.pdf`;
      const filePath = `users/doctors/${doctorFolder}/reports/${fileName}`.replace(/\\/g, '/');

      const report = new Report({
        doctorId: doctor._id,
        patientId: patient._id,
        filePath,
        description: `Report for diagnosis ${diagnosisId}`,
        reportText: reportText || '',
        doctorNotes: doctorNotes || ''
      });

      const doctorDir = path.join(__dirname, '..', '..', 'users', 'doctors', doctorFolder, 'reports');
      const patientDir = path.join(__dirname, '..', '..', 'users', 'patients', patientFolder, 'reports');

      // 2. Create folders
      console.time('Directory Creation');
      await Promise.all([
        fs.promises.mkdir(doctorDir, { recursive: true }),
        fs.promises.mkdir(patientDir, { recursive: true })
      ]);
      console.timeEnd('Directory Creation');

      const doctorPath = path.join(doctorDir, fileName);
      const patientPath = path.join(patientDir, fileName);

      // 3. Setup write streams
      console.time('Stream Setup');
      const doctorStream = fs.createWriteStream(doctorPath);
      const patientStream = fs.createWriteStream(patientPath);
      console.timeEnd('Stream Setup');

      const doc = new PDFDocument({ margin: 50, bufferPages: true });
      doc.pipe(doctorStream);
      doc.pipe(patientStream);

      // 🔷 Utilities
      const sectionHeader = (title) => {
        doc
          .moveDown(1)
          .fillColor('#003366')
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(title, { underline: true })
          .moveDown(0.3);
      };

      const labelData = (label, value) => {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#222')
          .text(`${label}: `, { continued: true })
          .font('Helvetica')
          .fillColor('#444')
          .text(value)
          .moveDown(0.2);
      };

      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // 🔷 Add Logo if you want
      const logoPath = path.join(__dirname, '..', '..', 'assets', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width - 100, 20, { width: 60 });
      }

      // 🔷 Header
      doc
        .fillColor('#005792')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Dream AI Medical Report', { align: 'center' })
        .moveDown(0.5)
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(1);

      // 🔷 Content
      console.time('PDF Content Generation');

      sectionHeader('Doctor Information');
      labelData('Doctor Name', `Dr. ${doctor.fullName}`);
      labelData('Doctor ID', doctor.customId || doctor._id);
      labelData('Email', doctor.email);
      labelData('Specialization', 'General Medicine');
      labelData('Date', formattedDate);
      labelData('Time', formattedTime);

      sectionHeader('Patient Information');
      labelData('Patient Name', patient.fullName);
      labelData('Patient ID', patient.customId || patient._id);
      labelData('Email', patient.email);
      labelData('Status', 'COMPLETED');

      sectionHeader('Diagnosis Result');
      labelData('AI Prediction', diagnosis.result);
      labelData('Confidence', `${diagnosis.confidence}%`);

      sectionHeader('Doctor Report');
      doc
        .fontSize(12)
        .fillColor('#000')
        .font('Helvetica')
        .text(reportText || 'No detailed report provided.', {
          lineGap: 4
        })
        .moveDown(1);

      sectionHeader('Additional Doctor Notes');
      doc
        .fontSize(12)
        .fillColor('#000')
        .font('Helvetica')
        .text(doctorNotes || 'No additional notes.', {
          lineGap: 4
        })
        .moveDown(1);

      // Signature section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#333')
        .text('Doctor Signature:', { continued: true })
        .font('Helvetica')
        .text(` ______________________`, { align: 'left' })
        .moveDown(1);

      // Footer
      doc
        .fontSize(9)
        .fillColor('gray')
        .text(
          'CONFIDENTIALITY NOTICE: This document contains confidential medical information.',
          { align: 'center' }
        )
        .text(
          'Unauthorized use or sharing is strictly prohibited.',
          { align: 'center' }
        )
        .text(
          '© 2025 Dream AI Medical Report System',
          { align: 'center' }
        );

      doc.end();
      console.timeEnd('PDF Content Generation');

      // 4. Wait for streams
      console.time('Stream Finalization');
      await Promise.all([
        new Promise((resolve, reject) => doctorStream.on('finish', resolve).on('error', reject)),
        new Promise((resolve, reject) => patientStream.on('finish', resolve).on('error', reject))
      ]);
      console.timeEnd('Stream Finalization');

      // 5. Save to DB
      console.time('Save Report to DB');
      await report.save();
      console.timeEnd('Save Report to DB');

      const baseUrl = process.env.BASE_URL || 'https://backendscan-production.up.railway.app';
      const fileUrl = `${baseUrl}/${filePath}`;

      res.status(201).json({
        success: true,
        message: 'Styled PDF report created successfully and sent to patient',
        report: {
          ...report.toObject(),
          fileUrl
        }
      });
      console.timeEnd('PDF Report Generation Request');

    } catch (err) {
      console.error('PDF Generation Error:', err);
      console.timeEnd('PDF Report Generation Request');
      res.status(500).json({
        success: false,
        message: 'Failed to generate styled PDF report',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

module.exports = router;
