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

function publicUser(user) {
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    loyaltyPoints: user.loyaltyPoints || 0
  };
}

function validatePassword(password) {
  if (password.length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    throw err;
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '').trim();

    if (!name || !email || !password) {
      const err = new Error('Name, email and password are required');
      err.status = 400;
      throw err;
    }
    validatePassword(password);

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }

    const user = await User.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 12),
      role: 'user'
    });

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }

    const user = await User.findOne({ email, isActive: { $ne: false } }).select('+password');
    if (!user) {
      const err = new Error('User not found');
      err.status = 401;
      throw err;
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      const err = new Error('Password is incorrect');
      err.status = 401;
      throw err;
    }

    res.json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', auth, async (req, res, next) => {
  try {
    const updates = {};
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = req.body.phone;
    const password = String(req.body.password || '');

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (password) {
      validatePassword(password);
      updates.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    })
      .select('-password')
      .lean();

    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
