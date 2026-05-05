const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.use(auth, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'manager'] } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    let role = String(req.body.role || '').toLowerCase();
    
    if (role !== 'admin' && role !== 'manager') {
      role = 'manager';
    }

    if (!name || !email || !password) {
      const err = new Error('Name, email and password are required');
      err.status = 400;
      throw err;
    }
    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters');
      err.status = 400;
      throw err;
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ['admin', 'manager'] } },
      { isActive: false },
      { new: true }
    )
      .select('-password')
      .lean();

    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    res.json({ message: 'User deactivated', user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
