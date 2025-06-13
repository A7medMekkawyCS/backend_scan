const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diagnosisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Diagnosis', required: true },
  reportText: { type: String, required: true },
  pdfUrl: { type: String },
  status: { 
    type: String, 
    enum: ['draft', 'finalized', 'sent'],
    default: 'draft'
  },
  patientNotes: { type: String },
  doctorNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
