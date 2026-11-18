const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get current user's bookings
// @route   GET /api/bookings/me
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ bookedAt: -1 })
    .populate({
      path: 'slot',
      select: 'title description startTime endTime user isBooked',
      populate: {
        path: 'user',
        select: 'name email',
      },
    });

  // Separate active and cancelled bookings
  const activeBookings = bookings.filter(b => b.status === 'booked');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  res.json({
    success: true,
    count: bookings.length,
    activeCount: activeBookings.length,
    cancelledCount: cancelledBookings.length,
    bookings: {
      active: activeBookings,
      cancelled: cancelledBookings,
    },
  });
});

module.exports = { getMyBookings };