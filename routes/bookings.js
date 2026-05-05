const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const generateRef = require('../utils/generateRef');

const router = express.Router();
const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

async function createUniqueRef() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const bookingRef = generateRef();
    const exists = await Booking.exists({ bookingRef });
    if (!exists) return bookingRef;
  }

  const err = new Error('Захиалгын дугаар үүсгэхэд алдаа гарлаа');
  err.status = 500;
  throw err;
}

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('ID буруу байна');
    err.status = 400;
    throw err;
  }
}

router.post('/', async (req, res, next) => {
  try {
    const booking = await Booking.create({
      bookingRef: await createUniqueRef(),
      clientName: req.body.clientName,
      phone: req.body.phone,
      email: req.body.email || '',
      package: req.body.package || 'basic',
      eventType: req.body.eventType,
      eventDate: req.body.eventDate,
      eventTime: req.body.eventTime,
      guestCount: Number(req.body.guestCount || 10),
      notes: req.body.notes || ''
    });

    res.status(201).json({
      message: 'Захиалга амжилттай бүртгэгдлээ',
      booking: {
        id: booking._id,
        bookingRef: booking.bookingRef,
        status: booking.status
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:ref/status', async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ bookingRef: req.params.ref.toUpperCase() })
      .select('bookingRef clientName eventDate eventTime status managerNote createdAt')
      .lean();

    if (!booking) {
      const err = new Error('Ийм дугаартай захиалга олдсонгүй');
      err.status = 404;
      throw err;
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

router.use(auth, requireRole('manager', 'admin'));

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    const { status, dateFrom, dateTo, q } = req.query;

    if (status && statuses.includes(status)) filter.status = status;

    if (dateFrom || dateTo) {
      filter.eventDate = {};
      if (dateFrom) filter.eventDate.$gte = new Date(dateFrom);
      if (dateTo) filter.eventDate.$lte = new Date(dateTo);
    }

    if (q) {
      filter.$or = [
        { bookingRef: new RegExp(q, 'i') },
        { clientName: new RegExp(q, 'i') },
        { phone: new RegExp(q, 'i') }
      ];
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    ensureObjectId(req.params.id);
    const booking = await Booking.findById(req.params.id).lean();

    if (!booking) {
      const err = new Error('Захиалга олдсонгүй');
      err.status = 404;
      throw err;
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    ensureObjectId(req.params.id);
    const { status } = req.body;

    if (!statuses.includes(status)) {
      const err = new Error('Статус буруу байна');
      err.status = 400;
      throw err;
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!booking) {
      const err = new Error('Захиалга олдсонгүй');
      err.status = 404;
      throw err;
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/note', async (req, res, next) => {
  try {
    ensureObjectId(req.params.id);
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { managerNote: req.body.managerNote || '' },
      { new: true, runValidators: true }
    ).lean();

    if (!booking) {
      const err = new Error('Захиалга олдсонгүй');
      err.status = 404;
      throw err;
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    ensureObjectId(req.params.id);
    const allowed = ['clientName', 'phone', 'email', 'package', 'eventType', 'eventDate', 'eventTime', 'guestCount', 'notes', 'status', 'managerNote'];
    const updates = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const booking = await Booking.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).lean();

    if (!booking) {
      const err = new Error('Захиалга олдсонгүй');
      err.status = 404;
      throw err;
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    ensureObjectId(req.params.id);
    const booking = await Booking.findByIdAndDelete(req.params.id).lean();

    if (!booking) {
      const err = new Error('Захиалга олдсонгүй');
      err.status = 404;
      throw err;
    }

    res.json({ message: 'Захиалга устгагдлаа' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
