const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      const err = new Error('Authentication required');
      err.status = 401;
      throw err;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: payload.id, isActive: { $ne: false } })
      .select('-password')
      .lean();

    if (!user) {
      const err = new Error('User not found or inactive');
      err.status = 401;
      throw err;
    }

    req.user = user;
    req.tokenRole = payload.role;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      err.message = 'Login session expired';
      err.status = 401;
    }
    if (err.name === 'JsonWebTokenError') {
      err.message = 'Invalid token';
      err.status = 401;
    }
    next(err);
  }
}

module.exports = auth;
