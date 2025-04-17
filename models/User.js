const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  userId: { type: Number, unique: true }, 
  mobilenumber: { type: String, required: false },
  birthDate: { type: Date },
  profileImage: { type: String, default: 'default.png' },
  doctorUserId: { type: String, unique: true, sparse: true },
  patientUserId: { type: String, unique: true, sparse: true },
  medicalLicense: { type: String },
  specialization: { type: String },
  verifiedAsDoctor: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
