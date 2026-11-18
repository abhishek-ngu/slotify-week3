const express = require('express');
const { getMyBookings } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All booking routes are protected
router.use(protect);

router.get('/me', getMyBookings);

module.exports = router;