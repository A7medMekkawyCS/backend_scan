// models/Counter.js
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true }, // 'userId'
  seq: { type: Number, default: 1 }
});

module.exports = mongoose.model('Counter', counterSchema);
