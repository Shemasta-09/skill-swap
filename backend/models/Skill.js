const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill_name: { type: String, required: true },
  type: { type: String, enum: ['offer', 'want'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Skill', skillSchema);
