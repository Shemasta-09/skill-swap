const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '_');
      cb(null, fileName);
    }
  })
});

function getFileType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
}

// @route   POST api/messages
// @desc    Send a message with optional attachments via JSON
// @access  Private
router.post('/', auth, async (req, res) => {
  const { receiver_id, message, attachments } = req.body;

  try {
    const newMessage = new Message({
      sender_id: req.user.id,
      receiver_id,
      message: message || '',
      attachments: Array.isArray(attachments) ? attachments : []
    });

    const savedMessage = await newMessage.save();
    res.json(savedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/messages/upload
// @desc    Send a message with file attachments
// @access  Private
router.post('/upload', auth, upload.array('attachments', 10), async (req, res) => {
  const { receiver_id, message } = req.body;

  try {
    const attachments = (req.files || []).map(file => ({
      type: getFileType(file.mimetype),
      name: file.originalname,
      url: `/uploads/${file.filename}`
    }));

    const newMessage = new Message({
      sender_id: req.user.id,
      receiver_id,
      message: message || '',
      attachments
    });

    const savedMessage = await newMessage.save();
    res.json(savedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/messages/:userId
// @desc    Get conversation between logged in user and another user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender_id: req.user.id, receiver_id: req.params.userId },
        { sender_id: req.params.userId, receiver_id: req.user.id }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
