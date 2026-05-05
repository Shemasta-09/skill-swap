const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const auth = require('../middleware/auth');

// @route   POST api/requests
// @desc    Create a skill exchange request
// @access  Private
router.post('/', auth, async (req, res) => {
  const { receiver_id, skill_id } = req.body;

  try {
    // Check if request already exists
    let existingRequest = await Request.findOne({
      sender_id: req.user.id,
      receiver_id,
      skill_id
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    const newRequest = new Request({
      sender_id: req.user.id,
      receiver_id,
      skill_id
    });

    const request = await newRequest.save();
    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/requests
// @desc    Get all requests for logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const requests = await Request.find({
      $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }]
    })
    .populate('sender_id', ['name', 'email', 'profile_image'])
    .populate('receiver_id', ['name', 'email', 'profile_image'])
    .populate('skill_id', ['skill_name', 'type']);

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/requests/:id
// @desc    Update request status (accept/reject)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { status } = req.body;

  try {
    let request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Ensure the receiver is the one updating it
    if (request.receiver_id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    request.status = status;
    await request.save();

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
