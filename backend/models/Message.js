const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: '' },
  attachments: [
    {
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document'],
        required: true
      },
      name: { type: String, required: true },
      url: { type: String, required: true }
    }
  ],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
