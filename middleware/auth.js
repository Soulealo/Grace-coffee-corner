const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      const err = new Error('Нэвтрэх шаардлагатай');
      err.status = 401;
      throw err;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: payload.id, isActive: true })
      .select('-password')
      .lean();

    if (!user) {
      const err = new Error('Хэрэглэгч олдсонгүй эсвэл идэвхгүй байна');
      err.status = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      err.message = 'Нэвтрэх хугацаа дууссан';
      err.status = 401;
    }
    if (err.name === 'JsonWebTokenError') {
      err.message = 'Token буруу байна';
      err.status = 401;
    }
    next(err);
  }
}

module.exports = auth;
