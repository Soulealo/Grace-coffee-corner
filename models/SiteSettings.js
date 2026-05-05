const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'main'
    },
    bankName: {
      type: String,
      default: 'Khan Bank'
    },
    bankAccount: {
      type: String,
      default: '5023456789'
    },
    bankHolder: {
      type: String,
      default: 'Grace Coffee Shop'
    },
    facebookUrl: {
      type: String,
      default: 'https://www.facebook.com/gracedarkhan'
    },
    primaryColor: {
      type: String,
      default: '#2C1A0E'
    },
    accentColor: {
      type: String,
      default: '#C08B45'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
