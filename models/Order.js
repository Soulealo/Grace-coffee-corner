const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    colorName: String,
    quantity: {
      type: Number,
      min: 1,
      required: true
    },
    price: {
      type: Number,
      min: 0,
      required: true
    },
    image: String
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderRef: {
      type: String,
      unique: true,
      required: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ['bank', 'facebook', 'cash'],
      default: 'bank'
    },
    items: [orderItemSchema],
    total: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'delivering', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
