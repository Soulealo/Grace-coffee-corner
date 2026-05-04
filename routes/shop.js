const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const SiteSettings = require('../models/SiteSettings');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();
const adminOnly = [auth, requireRole('director', 'manager')];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function orderRef() {
  return `GC-EVENT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
}

async function getSettings() {
  return SiteSettings.findOneAndUpdate(
    { key: 'main' },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

router.get('/settings', async (req, res, next) => {
  try {
    res.json({ settings: await getSettings() });
  } catch (err) {
    next(err);
  }
});

router.patch('/settings', ...adminOnly, async (req, res, next) => {
  try {
    const allowed = ['bankName', 'bankAccount', 'bankHolder', 'facebookUrl', 'primaryColor', 'accentColor'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      updates,
      { upsert: true, new: true, runValidators: true }
    ).lean();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', ...adminOnly, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      const err = new Error('Ангиллын нэр оруулна уу');
      err.status = 400;
      throw err;
    }

    const category = await Category.findOneAndUpdate(
      { slug: slugify(req.body.slug || name) },
      { name, slug: slugify(req.body.slug || name), isActive: true },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', ...adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).lean();
    res.json({ category });
  } catch (err) {
    next(err);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    const products = await Product.find(filter).sort({ isFeatured: -1, createdAt: -1 }).lean();
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product || !product.isActive) {
      const err = new Error('Бүтээгдэхүүн олдсонгүй');
      err.status = 404;
      throw err;
    }
    const similar = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    }).limit(4).lean();
    res.json({ product, similar });
  } catch (err) {
    next(err);
  }
});

router.post('/products', ...adminOnly, async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

router.patch('/products/:id', ...adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).lean();
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', ...adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).lean();
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', ...adminOnly, async (req, res, next) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.post('/orders', async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      const err = new Error('Сагс хоосон байна');
      err.status = 400;
      throw err;
    }

    const total = req.body.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const order = await Order.create({
      orderRef: orderRef(),
      customerName: req.body.customerName,
      phone: req.body.phone,
      address: req.body.address,
      paymentMethod: req.body.paymentMethod || 'bank',
      items: req.body.items,
      total
    });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id/status', ...adminOnly, async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).lean();
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
