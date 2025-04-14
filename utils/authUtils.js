const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

const generateDoctorId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `DOC-${random}`;
};

const generatePatientId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PAT-${random}`;
};

module.exports = {
  generateToken,
  generateDoctorId,
  generatePatientId
};
