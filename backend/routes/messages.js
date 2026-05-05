const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// @route   POST api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
  const { receiver_id, message } = req.body;

  try {
    const newMessage = new Message({
      sender_id: req.user.id,
      receiver_id,
      message
    });

    const savedMessage = await newMessage.save();
    res.json(savedMessage);
  } catch (err) {
    console.error(err.message);
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
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
