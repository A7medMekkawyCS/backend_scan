const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateDoctorId = () => `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
const generatePatientId = () => `PAT-${Math.floor(100000 + Math.random() * 900000)}`;

module.exports = { generateToken, generateDoctorId, generatePatientId };
