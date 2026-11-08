const Slot = require('../models/Slot');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new slot
// @route   POST /api/slots
// @access  Private
const createSlot = asyncHandler(async (req, res) => {
  const { title, description, startTime, endTime } = req.body;

  // Validate required fields
  if (!title || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title, startTime, and endTime',
    });
  }

  // Validate dates
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format for startTime or endTime',
    });
  }

  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: 'endTime must be after startTime',
    });
  }

  // Create slot with authenticated user
  const slot = await Slot.create({
    title,
    description,
    startTime: start,
    endTime: end,
    user: req.user._id,
  });

  // Populate user info (optional)
  await slot.populate('user', 'name email');

  res.status(201).json({
    success: true,
    message: 'Slot created successfully',
    slot,
  });
});

// @desc    Get all slots for logged-in user
// @route   GET /api/slots
// @access  Private
const getSlots = asyncHandler(async (req, res) => {
  const slots = await Slot.find({ user: req.user._id })
    .sort({ startTime: 1 })
    .populate('user', 'name email');

  res.json({
    success: true,
    count: slots.length,
    slots,
  });
});

// @desc    Get single slot
// @route   GET /api/slots/:id
// @access  Private
const getSlot = asyncHandler(async (req, res) => {
  const slot = await Slot.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate('user', 'name email');

  if (!slot) {
    return res.status(404).json({
      success: false,
      message: 'Slot not found',
    });
  }

  res.json({
    success: true,
    slot,
  });
});

// @desc    Delete a slot
// @route   DELETE /api/slots/:id
// @access  Private
const deleteSlot = asyncHandler(async (req, res) => {
  const slot = await Slot.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!slot) {
    return res.status(404).json({
      success: false,
      message: 'Slot not found or not authorized',
    });
  }

  await slot.deleteOne();

  res.json({
    success: true,
    message: 'Slot deleted successfully',
  });
});

module.exports = { createSlot, getSlots, getSlot, deleteSlot };