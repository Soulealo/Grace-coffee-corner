const express = require('express');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.use(auth, requireRole('director'));

router.get('/monthly', async (req, res, next) => {
  try {
    const now = new Date();
    const year = Number(req.query.year || now.getFullYear());
    const month = Number(req.query.month || now.getMonth() + 1);

    if (!year || month < 1 || month > 12) {
      const err = new Error('Он, сар буруу байна');
      err.status = 400;
      throw err;
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const [bookings, packages] = await Promise.all([
      Booking.find({ eventDate: { $gte: start, $lt: end } }).lean(),
      Package.find({}).lean()
    ]);

    const prices = Object.fromEntries(packages.map((item) => [item.code, item.price]));
    const byStatus = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});
    const payable = bookings.filter((booking) => ['confirmed', 'completed'].includes(booking.status));
    const revenue = payable.reduce((sum, booking) => sum + (prices[booking.package] || 0), 0);

    res.json({
      year,
      month,
      bookingCount: bookings.length,
      confirmedOrCompletedCount: payable.length,
      revenue,
      byStatus
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
