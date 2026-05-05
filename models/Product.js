const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    colorName: {
      type: String,
      trim: true,
      default: 'Default'
    },
    colorHex: {
      type: String,
      trim: true,
      default: '#C08B45'
    },
    image: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
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
      required: [true, 'Product name is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: 0
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
      trim: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryInfo: {
      type: String,
      trim: true,
      default: 'Manager will confirm event date and delivery details.'
    },
    variants: {
      type: [variantSchema],
      default: []
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
