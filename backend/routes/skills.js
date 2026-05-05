const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');

// @route   POST api/skills
// @desc    Add a new skill (offer or want)
// @access  Private
router.post('/', auth, async (req, res) => {
  const { skill_name, type } = req.body;

  try {
    const newSkill = new Skill({
      user_id: req.user.id,
      skill_name,
      type
    });

    const skill = await newSkill.save();
    res.json(skill);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/skills
// @desc    Get all skills with user info
// @access  Public
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find().populate('user_id', ['name', 'email', 'profile_image']);
    res.json(skills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/skills/user/:user_id
// @desc    Get skills by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const skills = await Skill.find({ user_id: req.params.user_id });
    res.json(skills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/skills/:id
// @desc    Delete a skill
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Make sure user owns skill
    if (skill.user_id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await skill.deleteOne();
    res.json({ message: 'Skill removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
