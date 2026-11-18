const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked',
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ slot: 1 }, { unique: true }); // One booking per slot

module.exports = mongoose.model('Booking', bookingSchema);