const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a slot title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  startTime: {
    type: Date,
    required: [true, 'Please provide a start time'],
  },
  endTime: {
    type: Date,
    required: [true, 'Please provide an end time'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
slotSchema.index({ user: 1, startTime: 1 });

module.exports = mongoose.model('Slot', slotSchema);