const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Diagnosis = require('../../models/Diagnosis');
const Report = require('../../models/Report');
const { authenticateUser } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');
const User = require('../../models/User');
const Message = require('../../models/Message');

// =========================
// Helper Functions
// =========================

/**
 * Formats date in English (e.g., "June 13, 2025")
 */
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats time in English (e.g., "05:25 AM")
 */
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Creates a PDF report document
 */
const generatePdfReport = async (report, diagnosis, user, reportText, doctorNotes) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 30,
        info: {
          Title: `Medical Report - ${diagnosis.userId.fullName}`,
          Author: 'Dream AI',
          Subject: 'Medical Diagnosis Report'
        }
      });

      // Prepare patient folder
      const patientFolder = diagnosis.userId.userId || diagnosis.userId._id.toString();
      const reportFolderPath = path.join(__dirname, `../../users/patients/${patientFolder}/reports`);
      if (!fs.existsSync(reportFolderPath)) fs.mkdirSync(reportFolderPath, { recursive: true });
      const pdfPath = path.join(reportFolderPath, `${report._id}.pdf`);
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // Add watermark
      doc.opacity(2)
         .fillColor('#d35400')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('DREAM AI', 10, 10, { 
           width: 70,
           align: 'center',
           angle: 10 
         });
      doc.opacity(1);

      // Header
      doc.fillColor('#1a4b8c')
         .fontSize(40)
         .font('Helvetica-Bold')
         .text('Dream AI', { align: 'center' });
         
      doc.moveDown(0.1)
         .fillColor('#2a6fdb')
         .fontSize(14)
         .font('Helvetica')
         .text('Scan Cancer Medical Diagnosis', { align: 'center' });
         
      // Report metadata
      doc.moveDown(1)
         .fillColor('black')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Report Information', { underline: true });
      
      const reportInfo = [
        { label: 'Report ID:', value: report._id.toString() },
        { label: 'Date:', value: formatDate(new Date()) },
        { label: 'Time:', value: formatTime(new Date()) }
      ];

      let yPos = doc.y + 10;
      reportInfo.forEach(info => {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text(info.label, 30, yPos)
           .font('Helvetica')
           .text(info.value, 120, yPos);
        yPos += 15;
      });

   // Patient Information Box
const patientBoxX = 30;
const patientBoxY = yPos + 25;
doc.moveDown()
   .fillColor('#1a4b8c')
   .fontSize(14)
   .font('Helvetica-Bold')
   .text('Patient Information', patientBoxX, yPos + 10, { underline: true });

doc.roundedRect(patientBoxX, patientBoxY, 250, 100, 8)
   .fill('#f0f8ff')
   .stroke('#1a4b8c');

const patientDetails = [
  ['Name', diagnosis.userId.fullName],
  ['ID', patientFolder],
  ['Status', report.status.toUpperCase()],
  ['Email', diagnosis.userId.email]
];

patientDetails.forEach(([label, value], index) => {
  const lineY = patientBoxY + 10 + (index * 20);
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor('#1a4b8c')
     .text(`${label}:`, patientBoxX + 10, lineY)
     .font('Helvetica')
     .fillColor('black')
     .text(value, patientBoxX + 80, lineY);
});

// Doctor Information Box
const doctorBoxX = 320;
const doctorBoxY = yPos + 25;
doc.fillColor('#1a4b8c')
   .fontSize(14)
   .font('Helvetica-Bold')
   .text('Doctor Information', doctorBoxX, yPos + 10, { underline: true });

doc.roundedRect(doctorBoxX, doctorBoxY, 250, 100, 8)
   .fill('#f0f8ff')
   .stroke('#1a4b8c');

const doctorDetails = [
  ['Name', user.fullName],
  ['ID', user._id],
  ['Specialization', user.specialization || 'General Medicine'],
  ['Email', user.email]
];

doctorDetails.forEach(([label, value], index) => {
  const lineY = doctorBoxY + 10 + (index * 20);
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor('#1a4b8c')
     .text(`${label}:`, doctorBoxX + 10, lineY)
     .font('Helvetica')
     .fillColor('black')
     .text(value, doctorBoxX + 90, lineY);
});


      // Diagnosis Information
      doc.moveDown(3)
         .fillColor('#1a4b8c')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Diagnosis Information', 30, yPos + 130, { underline: true });

      doc.roundedRect(30, doc.y + 5, 540, 80, 8)
         .fill('#f0f8ff')
         .stroke('#1a4b8c');

      const diagnosisDetails = [
        { label: 'AI Diagnosis', value: diagnosis.result, x: 40, y: doc.y + 20 },
        { label: 'Confidence', value: `${(diagnosis.confidence * 100).toFixed(2)}%`, x: 40, y: doc.y + 40 },
        { label: 'Date', value: formatDate(new Date(diagnosis.createdAt)), x: 300, y: doc.y + 20 },
        { label: 'Time', value: formatTime(new Date(diagnosis.createdAt)), x: 300, y: doc.y + 40 }
      ];

      diagnosisDetails.forEach(item => {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#1a4b8c')
           .text(`${item.label}:`, item.x, item.y)
           .font('Helvetica')
           .fillColor('black')
           .text(item.value, item.x + 100, item.y);
      });

      // Medical Report Content
      doc.moveDown(3)
         .fillColor('#1a4b8c')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('Medical Report', 30, yPos + 250, { underline: true });

      doc.moveDown(0.5)
         .fillColor('#d35400')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text("Doctor's Report");

      doc.moveDown(0.3)
         .fillColor('black')
         .fontSize(11)
         .font('Helvetica')
         .text(reportText, {
           align: 'left',
           lineGap: 5,
           width: 500,
           indent: 10
         });

      if (doctorNotes) {
        doc.moveDown(1)
           .fillColor('#d35400')
           .fontSize(13)
           .font('Helvetica-Bold')
           .text('Additional Notes');
           
        doc.moveDown(0.3)
           .fillColor('black')
           .fontSize(11)
           .font('Helvetica')
           .text(doctorNotes, {
             align: 'left',
             lineGap: 5,
             width: 500,
             indent: 10
           });
      }

      // Signature Section
      doc.moveDown(2)
         .lineWidth(1)
         .moveTo(350, doc.y)
         .lineTo(550, doc.y)
         .stroke('#888');

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#1a4b8c')
         .text(`Doctor: ${user.fullName}`, 45, doc.y + 10, { align: 'left' })
         .fontSize(10)
         .font('Helvetica')
         .fillColor('black')
         .text(`Specialization: ${user.specialization || 'General Medicine'}`, { align: 'left' })
         .moveDown(0.5)
         .text('Signature:', { align: 'left' })
         .moveDown(1)
         .text(`Date: ${formatDate(new Date())}`, { align: 'left' })
         .text(`Time: ${formatTime(new Date())}`, { align: 'left' });

      // Footer
      // خط فاصل علوي
doc.moveDown(2);
const lineY = doc.y; // حفظ Y الحالي قبل رسم الخط
doc.lineWidth(1)
   .moveTo(35, lineY)
   .lineTo(560, lineY)
   .stroke('#888'); // الخط الرمادي

// نص السرية والحقوق
doc.fontSize(8)
   .fillColor('#666')
   .text(
     'CONFIDENTIALITY NOTICE: This Dream AI report contains sensitive medical information. Unauthorized access, distribution, or reproduction is strictly prohibited.',
     35, lineY + 5, // وضع النص أسفل الخط مباشرة بمسافة بسيطة
     {
       align: 'center',
       width: 500,
       lineGap: 2
     }
   )
   .moveDown(0.3)
   .text(`© ${new Date().getFullYear()} Dream AI Medical Report System. All rights reserved.`, {
     align: 'center',
     width: 500
   });


      // Page numbering
      const pageHeight = doc.page.height;
      doc.fontSize(8)
         .fillColor('#666')
         .text('Page 1 of 1', 30, pageHeight - 20, { 
           align: 'center', 
           width: 535 
         });

      doc.end();

      writeStream.on('finish', () => resolve(pdfPath));
      writeStream.on('error', (error) => reject(error));
    } catch (error) {
      reject(error);
    }
  });
};

// =========================
// Route Handlers
// =========================

/**
 * Get all messages for the doctor
 */
const getDoctorMessages = async (req, res) => {
  try {
    const messages = await Message.find({ to: req.user._id })
      .populate('diagnosisId')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching doctor messages:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages',
      error: err.message 
    });
  }
};

/**
 * Create/update a report and generate PDF
 */
const createReport = async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    const { reportText, doctorNotes } = req.body;
    
    // Validate input
    if (!reportText) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report text is required' 
      });
    }

    const diagnosis = await Diagnosis.findById(diagnosisId).populate('userId');
    if (!diagnosis) {
      return res.status(404).json({ 
        success: false, 
        message: 'Diagnosis not found' 
      });
    }

    // Create or update report
    const reportData = {
      diagnosisId,
      doctorId: req.user._id,
      patientId: diagnosis.userId._id,
      reportText,
      doctorNotes: doctorNotes || '',
      status: 'completed'
    };

    let report = await Report.findOneAndUpdate(
      { diagnosisId, doctorId: req.user._id },
      reportData,
      { new: true, upsert: true }
    );

    // Generate PDF report
    const pdfPath = await generatePdfReport(
      report,
      diagnosis,
      req.user,
      reportText,
      doctorNotes
    );

    // Update message status if needed
    await Message.updateMany(
      { diagnosisId, to: req.user._id },
      { $set: { status: 'responded' } }
    );

    res.status(201).json({ 
      success: true, 
      message: 'Report generated and saved successfully',
      report,
      pdfPath: path.basename(pdfPath)
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate report',
      error: error.message 
    });
  }
};

// =========================
// Routes
// =========================

router.get('/', 
  authenticateUser, 
  authorizeRole(['doctor']), 
  getDoctorMessages
);

router.post('/report/:diagnosisId', 
  authenticateUser, 
  authorizeRole(['doctor']), 
  createReport
);

// =========================
// Export
// =========================

module.exports = router; 