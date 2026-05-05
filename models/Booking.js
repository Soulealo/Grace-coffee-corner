const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      unique: true,
      index: true,
      required: true
    },
    clientName: {
      type: String,
      required: [true, 'Нэр заавал оруулна'],
      trim: true,
      minlength: [2, 'Нэр 2 тэмдэгтээс урт байх ёстой']
    },
    phone: {
      type: String,
      required: [true, 'Утас заавал оруулна'],
      trim: true,
      match: [/^[0-9+\-\s()]{6,20}$/, 'Утасны дугаар буруу байна']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Имэйл хаяг буруу байна']
    },
    package: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      default: 'basic'
    },
    eventType: {
      type: String,
      required: [true, 'Event төрөл заавал оруулна'],
      trim: true
    },
    eventDate: {
      type: Date,
      required: [true, 'Event огноо заавал оруулна']
    },
    eventTime: {
      type: String,
      required: [true, 'Event цаг заавал оруулна'],
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Цаг HH:mm форматтай байх ёстой']
    },
    guestCount: {
      type: Number,
      default: 10,
      min: [1, 'Зочдын тоо 1-ээс их байх ёстой'],
      max: [300, 'Зочдын тоо 300-аас их байж болохгүй']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Тайлбар хэт урт байна']
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending'
    },
    managerNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Менежерийн тэмдэглэл хэт урт байна']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
