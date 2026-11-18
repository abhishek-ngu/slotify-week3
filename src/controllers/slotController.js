const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');

// Helper function to check for time conflicts
const hasTimeConflict = (existingStart, existingEnd, newStart, newEnd) => {
  return newStart < existingEnd && newEnd > existingStart;
};

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

  // Check for time conflicts with existing slots on the same date
  // We compare slots on the same day (ignoring time component for date matching)
  const startOfDay = new Date(start);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(start);
  endOfDay.setHours(23, 59, 59, 999);

  const conflictingSlots = await Slot.find({
    user: req.user._id,
    startTime: { $gte: startOfDay, $lte: endOfDay },
  });

  for (const existingSlot of conflictingSlots) {
    if (hasTimeConflict(existingSlot.startTime, existingSlot.endTime, start, end)) {
      return res.status(409).json({
        success: false,
        message: 'Time conflict with existing slot',
        conflict: {
          existingSlot: {
            id: existingSlot._id,
            title: existingSlot.title,
            startTime: existingSlot.startTime,
            endTime: existingSlot.endTime,
          },
        },
      });
    }
  }

  // Create slot with authenticated user
  const slot = await Slot.create({
    title,
    description,
    startTime: start,
    endTime: end,
    user: req.user._id,
  });

  // Populate user info
  await slot.populate('user', 'name email');

  res.status(201).json({
    success: true,
    message: 'Slot created successfully',
    slot,
  });
});

// @desc    Get all slots for logged-in user (with availability filter)
// @route   GET /api/slots
// @access  Private
const getSlots = asyncHandler(async (req, res) => {
  const { available } = req.query;
  const userId = req.user._id;

  // Build query
  let query = { user: userId };

  // Filter by availability if requested
  if (available === 'true') {
    query.isBooked = false;
  }

  const slots = await Slot.find(query)
    .sort({ startTime: 1 })
    .populate('user', 'name email')
    .populate('bookedBy', 'name email');

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
  })
    .populate('user', 'name email')
    .populate('bookedBy', 'name email');

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

// @desc    Book a slot
// @route   POST /api/slots/:id/book
// @access  Private
const bookSlot = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id);

  if (!slot) {
    return res.status(404).json({
      success: false,
      message: 'Slot not found',
    });
  }

  // Check if slot is already booked
  if (slot.isBooked) {
    return res.status(400).json({
      success: false,
      message: 'Slot is already booked',
    });
  }

  // Check if user is trying to book their own slot (optional - could allow)
  // if (slot.user.toString() === req.user._id.toString()) {
  //   return res.status(400).json({
  //     success: false,
  //     message: 'Cannot book your own slot',
  //   });
  // }

  // Mark slot as booked
  slot.isBooked = true;
  slot.bookedBy = req.user._id;
  slot.bookedAt = new Date();
  await slot.save();

  // Create booking record
  const booking = await Booking.create({
    slot: slot._id,
    user: req.user._id,
    status: 'booked',
    bookedAt: new Date(),
  });

  // Populate for response
  await slot.populate('user', 'name email');
  await slot.populate('bookedBy', 'name email');
  await booking.populate('slot', 'title startTime endTime');
  await booking.populate('user', 'name email');

  res.json({
    success: true,
    message: 'Slot booked successfully',
    slot,
    booking,
  });
});

// @desc    Cancel a booking
// @route   POST /api/slots/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id);

  if (!slot) {
    return res.status(404).json({
      success: false,
      message: 'Slot not found',
    });
  }

  // Check if slot is booked
  if (!slot.isBooked) {
    return res.status(400).json({
      success: false,
      message: 'Slot is not booked',
    });
  }

  // Check ownership - only the user who booked it can cancel (or admin)
  if (slot.bookedBy.toString() !== req.user._id.toString()) {
    // Check if user is admin (optional - if you have admin roles)
    // For now, only the booking user can cancel
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this booking',
    });
  }

  // Update slot - unbook it
  slot.isBooked = false;
  slot.bookedBy = null;
  slot.bookedAt = null;
  await slot.save();

  // Update booking record
  const booking = await Booking.findOneAndUpdate(
    { slot: slot._id, user: req.user._id, status: 'booked' },
    { status: 'cancelled', cancelledAt: new Date() },
    { returnDocument: 'after' }
  );

  // Populate for response
  await slot.populate('user', 'name email');

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    slot,
    booking,
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

  // Also delete associated booking if exists
  await Booking.deleteOne({ slot: slot._id });

  await slot.deleteOne();

  res.json({
    success: true,
    message: 'Slot deleted successfully',
  });
});

module.exports = { createSlot, getSlots, getSlot, bookSlot, cancelBooking, deleteSlot };