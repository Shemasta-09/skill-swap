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
    if (status === 'accepted') {
      request.completed = true;
      request.completedAt = Date.now();
    }

    await request.save();

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/requests/:id/complete
// @desc    Mark a request as completed after the exchange
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    let request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.sender_id.toString() !== req.user.id && request.receiver_id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    request.completed = true;
    request.completedAt = Date.now();
    await request.save();

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/requests/stats
// @desc    Get tracking stats for requests and skills
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const requests = await Request.find().populate('skill_id', ['skill_name']);
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const accepted = requests.filter(r => r.status === 'accepted').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const completed = requests.filter(r => r.completed).length;

    const popularMap = requests.reduce((acc, req) => {
      const name = req.skill_id?.skill_name || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    const popularSkills = Object.entries(popularMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill_name, count]) => ({ skill_name, count }));

    res.json({ total, pending, accepted, rejected, completed, popularSkills });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
