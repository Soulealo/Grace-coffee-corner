const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const SiteSettings = require('../models/SiteSettings');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();
const productManagers = [auth, requireRole('admin', 'manager')];
const adminOnly = [auth, requireRole('admin')];

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  return auth(req, res, next);
}

function orderRef() {
  return `GC-EVENT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
}

function requestError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function isEventDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function isEventTime(value) {
  return /^\d{2}:00$/.test(String(value || ''));
}

function todayDateString() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function buildEventSlots(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const start = isWeekend ? 9 : 8;
  const end = isWeekend ? 23 : 22;
  const slots = [];

  for (let hour = start; hour <= end; hour += 1) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
  }

  return slots;
}

function isObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''));
}

function firstVariant(product) {
  return product.variants && product.variants.length ? product.variants[0] : null;
}

function sameId(left, right) {
  return String(left || '') === String(right || '');
}

function findRequestedVariant(product, item) {
  const variants = product.variants || [];
  if (!variants.length) return null;
  if (item.variant) {
    return variants.find((variant) => sameId(variant._id, item.variant));
  }
  if (item.colorName) {
    return variants.find((variant) => variant.colorName === item.colorName);
  }
  return firstVariant(product);
}

function serializeProduct(product) {
  const categoryDoc = product.categoryId && typeof product.categoryId === 'object' ? product.categoryId : null;
  const variant = firstVariant(product);
  const image = product.image || variant?.image || '';
  const price = Number(product.price ?? variant?.price ?? 0);
  const stock = Number(product.stock ?? variant?.stock ?? 0);
  const variants = product.variants && product.variants.length
    ? product.variants.map((item) => ({
      ...item,
      image: item.image || image,
      price: Number(item.price ?? price),
      stock: Number(item.stock ?? stock)
    }))
    : [{
      _id: product._id,
      colorName: 'Үндсэн',
      colorHex: '#C08B45',
      image,
      price,
      stock,
      size: '',
      material: ''
    }];

  return {
    ...product,
    categoryId: categoryDoc?._id || product.categoryId,
    category: categoryDoc?.name || product.category || '',
    image,
    price,
    stock,
    variants
  };
}

function validateVariant(variant, fallback) {
  const price = Number(variant.price ?? fallback.price);
  const stock = Number(variant.stock ?? fallback.stock ?? 0);

  if (!variant.colorName) throw requestError('Variant name is required');
  if (!variant.image && !fallback.image) throw requestError('Variant image is required');
  if (!Number.isFinite(price) || price < 0) throw requestError('Variant price must be a valid number');
  if (!Number.isFinite(stock) || stock < 0) throw requestError('Variant stock must be a valid number');

  return {
    _id: variant._id || undefined,
    colorName: variant.colorName || 'Үндсэн',
    colorHex: variant.colorHex || '#C08B45',
    image: variant.image || fallback.image,
    price,
    stock,
    size: variant.size || '',
    material: variant.material || ''
  };
}

async function findCategory(input) {
  const value = String(input || '').trim();
  if (!value) return null;
  if (isObjectId(value)) return Category.findById(value).lean();
  return Category.findOne({ name: value, isActive: { $ne: false } }).lean();
}

async function buildProductBody(body) {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const category = await findCategory(body.categoryId || body.category);
  const variants = Array.isArray(body.variants) ? body.variants : [];
  const first = variants[0] || {};
  const image = String(body.image || first.image || '').trim();
  const price = Number(body.price ?? first.price ?? 0);
  const stock = Number(body.stock ?? first.stock ?? 0);

  if (!name) {
    const err = new Error('Product name is required');
    err.status = 400;
    throw err;
  }
  if (!description) {
    const err = new Error('Product description is required');
    err.status = 400;
    throw err;
  }
  if (!category) {
    const err = new Error('Valid category is required');
    err.status = 400;
    throw err;
  }
  if (!image) {
    const err = new Error('Product image is required');
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(price) || price < 0) {
    const err = new Error('Product price must be a valid number');
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(stock) || stock < 0) {
    const err = new Error('Product stock must be a valid number');
    err.status = 400;
    throw err;
  }

  return {
    name,
    price,
    description,
    categoryId: category._id,
    image,
    stock: Number.isFinite(stock) ? stock : 0,
    deliveryInfo: body.deliveryInfo || '',
    isFeatured: Boolean(body.isFeatured),
    isActive: body.isActive !== false,
    variants: variants.length
      ? variants.map((item) => validateVariant(item, { image, price, stock }))
      : [{
        colorName: body.colorName || 'Үндсэн',
        colorHex: body.colorHex || '#C08B45',
        image,
        price,
        stock: Number.isFinite(stock) ? stock : 0,
        size: body.size || '',
        material: body.material || ''
      }]
  };
}

async function createOrderWithUniqueRef(orderBody) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await Order.create({
        ...orderBody,
        orderRef: orderRef()
      });
    } catch (err) {
      if (err.code !== 11000 || attempt === 9) throw err;
    }
  }
  throw requestError('Order reference could not be generated', 500);
}

async function buildOrderFromCart(items) {
  const grouped = new Map();

  items.forEach((item) => {
    const quantity = Number(item.quantity);
    if (!isObjectId(item.product) || !Number.isInteger(quantity) || quantity <= 0) {
      throw requestError('Cart item is invalid');
    }

    const key = `${item.product}:${item.variant || item.colorName || ''}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      grouped.set(key, { ...item, quantity });
    }
  });

  const productIds = [...new Set([...grouped.values()].map((item) => item.product))];
  const products = await Product.find({ _id: { $in: productIds }, isActive: { $ne: false } }).lean();
  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const rollback = [];
  const orderItems = [];
  const stockUpdates = [];

  for (const item of grouped.values()) {
    const product = productMap.get(String(item.product));
    if (!product) throw requestError('Product not found', 404);

    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const variant = findRequestedVariant(product, item);
    if (hasVariants && !variant) throw requestError('Product option not found', 404);
    const quantity = item.quantity;
    const price = Number(variant?.price ?? product.price ?? 0);
    const stock = Number(variant?.stock ?? product.stock ?? 0);

    if (!Number.isFinite(price) || price < 0) throw requestError('Product price is invalid');
    if (!Number.isFinite(stock) || stock < quantity) throw requestError(`${product.name} нөөц хүрэлцэхгүй байна`, 409);

    stockUpdates.push({ product, variant, quantity });
    orderItems.push({
      product: product._id,
      variant: variant?._id,
      name: product.name,
      colorName: variant?.colorName || item.colorName || 'Сонголт',
      quantity,
      price,
      image: variant?.image || product.image
    });
  }

  for (const item of stockUpdates) {
    const { product, variant, quantity } = item;
    let updated;
    if (variant?._id) {
      updated = await Product.findOneAndUpdate(
        {
          _id: product._id,
          isActive: { $ne: false },
          variants: { $elemMatch: { _id: variant._id, stock: { $gte: quantity } } }
        },
        { $inc: { 'variants.$.stock': -quantity } },
        { new: true }
      ).lean();
      if (updated) rollback.push({ product: product._id, variant: variant._id, quantity });
    } else {
      updated = await Product.findOneAndUpdate(
        { _id: product._id, isActive: { $ne: false }, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      ).lean();
      if (updated) rollback.push({ product: product._id, quantity });
    }

    if (!updated) {
      await rollbackStock(rollback);
      throw requestError(`${product.name} нөөц хүрэлцэхгүй байна`, 409);
    }
  }

  return {
    items: orderItems,
    total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    rollback
  };
}

async function rollbackStock(rollback) {
  await Promise.all(rollback.map((item) => (
    item.variant
      ? Product.updateOne(
        { _id: item.product, 'variants._id': item.variant },
        { $inc: { 'variants.$.stock': item.quantity } }
      )
      : Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      )
  )));
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
    const categories = await Category.find({ isActive: { $ne: false } }).sort({ name: 1 }).lean();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', ...adminOnly, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      const err = new Error('Category name is required');
      err.status = 400;
      throw err;
    }

    const category = await Category.findOneAndUpdate(
      { name },
      { name, isActive: true },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

router.patch('/categories/:id', ...adminOnly, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      const err = new Error('Category name is required');
      err.status = 400;
      throw err;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, isActive: true },
      { new: true, runValidators: true }
    ).lean();
    if (!category) {
      const err = new Error('Category not found');
      err.status = 404;
      throw err;
    }

    res.json({ category });
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', ...adminOnly, async (req, res, next) => {
  try {
    const activeProducts = await Product.countDocuments({ categoryId: req.params.id, isActive: { $ne: false } });
    if (activeProducts > 0) {
      const err = new Error('Category has active products. Move or delete products first.');
      err.status = 409;
      throw err;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).lean();
    if (!category) {
      const err = new Error('Category not found');
      err.status = 404;
      throw err;
    }
    res.json({ category });
  } catch (err) {
    next(err);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const filter = { isActive: { $ne: false } };
    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    } else if (req.query.category) {
      const category = await findCategory(req.query.category);
      filter.categoryId = category?._id || null;
    }

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();
    res.json({ products: products.map(serializeProduct) });
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name').lean();
    if (!product || product.isActive === false) {
      const err = new Error('Product not found');
      err.status = 404;
      throw err;
    }

    const similar = await Product.find({
      _id: { $ne: product._id },
      categoryId: product.categoryId?._id || product.categoryId,
      isActive: { $ne: false }
    })
      .populate('categoryId', 'name')
      .limit(4)
      .lean();

    res.json({
      product: serializeProduct(product),
      similar: similar.map(serializeProduct)
    });
  } catch (err) {
    next(err);
  }
});

router.post('/products', ...productManagers, async (req, res, next) => {
  try {
    const body = await buildProductBody(req.body);
    const product = await Product.create(body);
    const saved = await Product.findById(product._id).populate('categoryId', 'name').lean();
    res.status(201).json({ product: serializeProduct(saved) });
  } catch (err) {
    next(err);
  }
});

router.patch('/products/:id', ...productManagers, async (req, res, next) => {
  try {
    const body = await buildProductBody(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true
    })
      .populate('categoryId', 'name')
      .lean();
    if (!product) {
      const err = new Error('Product not found');
      err.status = 404;
      throw err;
    }
    res.json({ product: serializeProduct(product) });
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', ...productManagers, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
      .populate('categoryId', 'name')
      .lean();
    if (!product) {
      const err = new Error('Product not found');
      err.status = 404;
      throw err;
    }
    res.json({ product: serializeProduct(product) });
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

router.get('/availability', async (req, res, next) => {
  try {
    const date = String(req.query.date || '').trim();
    if (!isEventDate(date)) {
      throw requestError('Event date is required');
    }

    const bookedOrders = await Order.find({
      eventDate: date,
      status: { $ne: 'cancelled' }
    })
      .select('eventTime')
      .lean();
    const bookedTimes = new Set(bookedOrders.map((order) => order.eventTime).filter(Boolean));
    const today = todayDateString();
    const currentHour = new Date().getHours();
    const slots = buildEventSlots(date).map((time) => ({
      time,
      available: !bookedTimes.has(time) && (date !== today || Number(time.slice(0, 2)) > currentHour)
    }));

    res.json({ date, slots });
  } catch (err) {
    next(err);
  }
});

router.get('/my-orders', auth, async (req, res, next) => {
  try {
    const filters = [{ user: req.user._id }];
    if (req.user.phone) {
      filters.push({ phone: req.user.phone });
    }

    const orders = await Order.find({ $or: filters })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.post('/orders', optionalAuth, async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      const err = new Error('Cart is empty');
      err.status = 400;
      throw err;
    }

    const customerName = String(req.body.customerName || '').trim();
    const phone = String(req.body.phone || '').trim();
    const address = String(req.body.address || '').trim();
    const eventDate = String(req.body.eventDate || '').trim();
    const eventTime = String(req.body.eventTime || '').trim();

    if (!customerName || !phone) {
      throw requestError('Customer name and phone are required');
    }
    if (!isEventDate(eventDate) || !isEventTime(eventTime)) {
      throw requestError('Event date and available time are required');
    }
    if (eventDate < todayDateString()) {
      throw requestError('Өнгөрсөн өдөр сонгох боломжгүй');
    }
    if (!buildEventSlots(eventDate).includes(eventTime)) {
      throw requestError('Сонгосон цаг ажиллах цагийн хуваарьт байхгүй байна');
    }

    const booked = await Order.exists({
      eventDate,
      eventTime,
      status: { $ne: 'cancelled' }
    });
    if (booked) {
      throw requestError('Сонгосон цаг захиалгатай байна. Өөр сул цаг сонгоно уу.', 409);
    }

    const orderCart = await buildOrderFromCart(req.body.items);
    let order;
    try {
      order = await createOrderWithUniqueRef({
        user: req.user?._id,
        customerName,
        phone,
        address: address || 'Дархан хот, Grace Coffee Shop, Link Hotel 1st floor',
        eventDate,
        eventTime,
        paymentMethod: req.body.paymentMethod || 'bank',
        items: orderCart.items,
        total: orderCart.total
      });
    } catch (err) {
      await rollbackStock(orderCart.rollback);
      throw err;
    }

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
    if (!order) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
