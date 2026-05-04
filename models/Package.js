const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Үнэ 0-ээс бага байж болохгүй']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
