const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const LoyaltyLog = require('../models/LoyaltyLog');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.use(auth);

router.get('/me', async (req, res, next) => {
  try {
    const [user, logs] = await Promise.all([
      User.findById(req.user._id).select('name email phone role loyaltyPoints').lean(),
      LoyaltyLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).lean()
    ]);

    res.json({ user, logs });
  } catch (err) {
    next(err);
  }
});

router.post('/redeem', async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const points = Number(req.body.points);
    const description = req.body.description || 'Loyalty урамшуулал ашиглав';

    if (!points || points <= 0) {
      const err = new Error('Ашиглах оноо буруу байна');
      err.status = 400;
      throw err;
    }

    let updatedUser;
    await session.withTransaction(async () => {
      updatedUser = await User.findOneAndUpdate(
        { _id: req.user._id, loyaltyPoints: { $gte: points } },
        { $inc: { loyaltyPoints: -points } },
        { new: true, session }
      ).select('name email phone role loyaltyPoints');

      if (!updatedUser) {
        const err = new Error('Оноо хүрэлцэхгүй байна');
        err.status = 400;
        throw err;
      }

      await LoyaltyLog.create([{
        user: req.user._id,
        type: 'redeem',
        points: -points,
        description
      }], { session });
    });

    res.json({ user: updatedUser });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
});

router.post('/earn', requireRole('director', 'manager'), async (req, res, next) => {
  try {
    const { email, description } = req.body;
    const points = Number(req.body.points);

    if (!email || !points || points <= 0) {
      const err = new Error('Имэйл болон нэмэх оноог зөв оруулна уу');
      err.status = 400;
      throw err;
    }

    const user = await User.findOneAndUpdate(
      { email: String(email).toLowerCase(), isActive: true },
      { $inc: { loyaltyPoints: points } },
      { new: true }
    ).select('name email phone role loyaltyPoints');

    if (!user) {
      const err = new Error('Хэрэглэгч олдсонгүй');
      err.status = 404;
      throw err;
    }

    await LoyaltyLog.create({
      user: user._id,
      type: 'earn',
      points,
      description: description || 'Оноо нэмэгдлээ',
      createdBy: req.user._id
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
