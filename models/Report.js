const mongoose = require('mongoose'); 

const reportSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  diagnosisId: { type: mongoose.Schema.Types.ObjectId, ref: "Diagnosis" },
  reportText: String,
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
