const express = require('express');
const Package = require('../models/Package');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();
const defaultPackages = [
  { code: 'basic', name: 'Basic', price: 150000 },
  { code: 'standard', name: 'Standard', price: 280000 },
  { code: 'premium', name: 'Premium', price: 480000 }
];

async function ensurePackages() {
  const count = await Package.countDocuments();
  if (!count) await Package.insertMany(defaultPackages);
}

router.get('/', async (req, res, next) => {
  try {
    await ensurePackages();
    const packages = await Package.find({}).sort({ price: 1 }).lean();
    res.json({ packages });
  } catch (err) {
    next(err);
  }
});

router.patch('/', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const prices = req.body.prices || req.body;
    const codes = ['basic', 'standard', 'premium'];

    await ensurePackages();
    await Promise.all(
      codes
        .filter((code) => prices[code] !== undefined)
        .map((code) => {
          const price = Number(prices[code]);
          if (Number.isNaN(price) || price < 0) {
            const err = new Error('Багцын үнэ буруу байна');
            err.status = 400;
            throw err;
          }
          return Package.findOneAndUpdate({ code }, { price }, { new: true, runValidators: true });
        })
    );

    const packages = await Package.find({}).sort({ price: 1 }).lean();
    res.json({ packages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
