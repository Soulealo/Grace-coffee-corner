const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Нэр заавал оруулна'],
      trim: true
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Имэйл заавал оруулна'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Имэйл хаяг буруу байна']
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    password: {
      type: String,
      required: [true, 'Нууц үг заавал оруулна'],
      minlength: [6, 'Нууц үг 6 тэмдэгтээс урт байх ёстой']
    },
    role: {
      type: String,
      enum: ['director', 'manager', 'customer'],
      default: 'customer'
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
