const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // المريض اللي أرسل الرسالة
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // الدكتور المستلم
    required: true,
  },
  diagnosisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diagnosis', // التشخيص المرتبط بالرسالة
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true // يضيف createdAt و updatedAt تلقائيًا
});

module.exports = mongoose.model('Message', messageSchema);
