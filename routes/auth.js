const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error('Имэйл болон нууц үгээ оруулна уу');
      err.status = 400;
      throw err;
    }

    const user = await User.findOne({ email: String(email).toLowerCase(), isActive: true });
    if (!user) {
      const err = new Error('Нэвтрэх мэдээлэл буруу байна');
      err.status = 401;
      throw err;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const err = new Error('Нэвтрэх мэдээлэл буруу байна');
      err.status = 401;
      throw err;
    }

    res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        loyaltyPoints: user.loyaltyPoints || 0
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      const err = new Error('Нэр, имэйл, нууц үг заавал оруулна уу');
      err.status = 400;
      throw err;
    }

    const user = await User.create({
      name,
      email,
      phone: phone || '',
      password: await bcrypt.hash(password, 12),
      role: 'customer',
      loyaltyPoints: 0
    });

    res.status(201).json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    res.json({ message: 'Амжилттай гарлаа' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', auth, async (req, res, next) => {
  try {
    const updates = {};
    const { name, email, phone, password } = req.body;

    if (name) updates.name = name;
    if (email) updates.email = String(email).toLowerCase();
    if (phone !== undefined) updates.phone = phone;
    if (password) updates.password = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    })
      .select('-password')
      .lean();

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
