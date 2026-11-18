const express = require('express');
const {
  createSlot,
  getSlots,
  getSlot,
  bookSlot,
  cancelBooking,
  deleteSlot,
} = require('../controllers/slotController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All slot routes are protected
router.use(protect);

router.route('/')
  .post(createSlot)
  .get(getSlots);

router.route('/:id')
  .get(getSlot)
  .delete(deleteSlot);

// Booking routes on slots
router.post('/:id/book', bookSlot);
router.post('/:id/cancel', cancelBooking);

module.exports = router;