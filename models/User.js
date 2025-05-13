const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');  // تأكد من وجود هذا النموذج

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  userId: { type: Number, unique: true },  // تسلسلي
  mobilenumber: { type: String },
  birthDate: { type: Date },
  profileImage: { type: String, default: 'default.png' },
  patientUserId: { type: String, unique: true, sparse: true },
  doctorUserId: { type: String, unique: true, sparse: true },
  medicalLicense: { type: String },
  specialization: { type: String },
  verifiedAsDoctor: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Middleware لتوليد userId تلقائيًا عند حفظ المستخدم
userSchema.pre('save', async function (next) {
  const user = this;

  if (!user.isModified('password')) return next();

  // تشفير كلمة المرور
  user.password = await bcrypt.hash(user.password, 12);

  // توليد userId تسلسلي إذا لم يكن موجودًا
  if (!user.userId) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'userId' },
      { $inc: { seq: 2 } },
      { new: true, upsert: true }
    );
    user.userId = counter.seq;
  }

  next();
});

// طريقة لمقارنة كلمات المرور
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
