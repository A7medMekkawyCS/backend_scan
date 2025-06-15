const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  qualifications: {
    type: String,
    required: true
  },
  medicalLicense: {
    type: String,
    required: true,
    unique: true
  },
  hospital: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Doctor", doctorSchema); 