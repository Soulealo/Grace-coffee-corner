const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    colorName: {
      type: String,
      required: [true, 'Сонголтын нэр оруулна уу'],
      trim: true
    },
    colorHex: {
      type: String,
      default: '#C08B45',
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Зургийн холбоос оруулна уу'],
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    size: {
      type: String,
      trim: true,
      default: ''
    },
    material: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Бүтээгдэхүүний нэр оруулна уу'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Ангилал сонгоно уу'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    deliveryInfo: {
      type: String,
      trim: true,
      default: 'Event-ийн өдөр, цагийг менежер холбогдож баталгаажуулна.'
    },
    variants: {
      type: [variantSchema],
      validate: {
        validator(value) {
          return value.length > 0;
        },
        message: 'Дор хаяж нэг сонголт оруулна уу'
      }
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
