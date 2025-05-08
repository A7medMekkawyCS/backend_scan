const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true }, 
  seq: { type: Number, default: 1 }
});

module.exports = mongoose.model('Counter', counterSchema);
