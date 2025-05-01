const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  result: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
