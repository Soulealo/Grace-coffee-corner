require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Package = require('./models/Package');
const Category = require('./models/Category');
const Product = require('./models/Product');
const SiteSettings = require('./models/SiteSettings');

const packageSeeds = [
  { code: 'basic', name: 'Basic', price: 150000 },
  { code: 'standard', name: 'Standard', price: 280000 },
  { code: 'premium', name: 'Premium', price: 480000 }
];

const categorySeeds = ['Event багц', 'Кофе сет', 'Амттан', 'Ундаа', 'Чимэглэл', 'Нэмэлт үйлчилгээ'];

const productSeeds = [
  {
    name: 'Birthday Coffee Set',
    category: 'Event багц',
    description: 'Төрсөн өдөр болон найз нөхдийн жижиг баярт зориулсан кофе, амттан, ширээний үндсэн засалттай багц.',
    deliveryInfo: 'Event-ийн огноо баталгаажсаны дараа менежер холбогдож цаг, хүргэлт, бэлтгэлийг тохирно.',
    isFeatured: true,
    variants: [
      {
        colorName: '10 хүн',
        colorHex: '#8B5E3C',
        image: 'https://images.unsplash.com/photo-1519671282429-b44660ead0a7?auto=format&fit=crop&w=1200&q=80',
        price: 180000,
        stock: 12,
        size: '10 хүний багц',
        material: 'Американо эсвэл латте сонголт, mini dessert, basic table setup'
      },
      {
        colorName: '20 хүн',
        colorHex: '#C08B45',
        image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80',
        price: 320000,
        stock: 8,
        size: '20 хүний багц',
        material: 'Кофе сет, dessert platter, ширээний basic decoration'
      }
    ]
  },
  {
    name: 'Corporate Meeting Set',
    category: 'Кофе сет',
    description: 'Байгууллагын уулзалт, сургалт, workshop-д тохиромжтой кофе болон snack set.',
    deliveryInfo: 'Ажлын өдрийн event-д 24 цагийн өмнө баталгаажуулна.',
    isFeatured: true,
    variants: [
      {
        colorName: 'Standard',
        colorHex: '#5A3422',
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
        price: 250000,
        stock: 10,
        size: '15-18 хүн',
        material: 'Американо, латте, цайны сонголт, sandwich/snack platter'
      }
    ]
  },
  {
    name: 'Dessert Platter',
    category: 'Амттан',
    description: 'Event ширээнд нэмэх mini cake, cookie, tart зэрэг амттаны platter.',
    deliveryInfo: 'Амттаны төрлийг event-ийн өмнө менежертэй баталгаажуулна.',
    variants: [
      {
        colorName: 'Mini',
        colorHex: '#E8CFA6',
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80',
        price: 95000,
        stock: 15,
        size: '10-12 хүний platter',
        material: 'Mini cake, cookie, tart сонголт'
      },
      {
        colorName: 'Premium',
        colorHex: '#C8955E',
        image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80',
        price: 180000,
        stock: 6,
        size: '20-25 хүний platter',
        material: 'Cake slice, macaron, cookie, fruit garnish'
      }
    ]
  },
  {
    name: 'Table Decoration Add-on',
    category: 'Чимэглэл',
    description: 'Жижиг event ширээнд зориулсан минимал цэцэг, нэрийн карт, дулаан өнгийн setup.',
    deliveryInfo: 'Чимэглэлийн өнгө, текстийг event-ийн өмнөх өдөр баталгаажуулна.',
    variants: [
      {
        colorName: 'Minimal',
        colorHex: '#D4B483',
        image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
        price: 70000,
        stock: 10,
        size: '1 ширээ',
        material: 'Mini flower, name card, candle style setup'
      }
    ]
  },
  {
    name: 'Event Coffee Add-ons',
    category: 'Кофе сет',
    description: 'Event багц дээр нэмэх халуун кофе сонголтууд. Зочдын тоонд тааруулж Americano, Latte, Cappuccino-г бэлтгэнэ.',
    deliveryInfo: 'Grace Coffee Shop дээрээс авах эсвэл event багцтайгаа хамт бэлтгүүлнэ.',
    variants: [
      {
        colorName: 'Americano 10ш',
        colorHex: '#5A3422',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
        price: 45000,
        stock: 30,
        size: '10 аяга',
        material: 'Hot Americano, cup, sugar option'
      },
      {
        colorName: 'Latte 10ш',
        colorHex: '#C08B45',
        image: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?auto=format&fit=crop&w=1200&q=80',
        price: 55000,
        stock: 25,
        size: '10 аяга',
        material: 'Hot latte, milk foam, cup set'
      },
      {
        colorName: 'Cappuccino 10ш',
        colorHex: '#8B5E3C',
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80',
        price: 55000,
        stock: 25,
        size: '10 аяга',
        material: 'Cappuccino, foam, cinnamon option'
      }
    ]
  },
  {
    name: 'Cake Selection Add-on',
    category: 'Амттан',
    description: 'Event ширээнд нэмэх cake slice, mini cake, celebration cake сонголтууд.',
    deliveryInfo: 'Cake-ийн төрлийг захиалгын дараа менежертэй баталгаажуулна.',
    variants: [
      {
        colorName: 'Mini Cake Set',
        colorHex: '#E8CFA6',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
        price: 85000,
        stock: 14,
        size: '8-10 хүн',
        material: 'Mini cake, berry garnish'
      },
      {
        colorName: 'Celebration Cake',
        colorHex: '#C8955E',
        image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80',
        price: 140000,
        stock: 8,
        size: '12-16 хүн',
        material: 'Whole cake, simple event text option'
      }
    ]
  },
  {
    name: 'Shake & Smoothie Bar',
    category: 'Ундаа',
    description: 'Event дээр кофе уудаггүй зочдод зориулсан shake, smoothie нэмэлт ундааны set.',
    deliveryInfo: 'Хүйтэн ундааг авах цагт тааруулж бэлтгэнэ.',
    variants: [
      {
        colorName: 'Milkshake 10ш',
        colorHex: '#F1D6B8',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80',
        price: 65000,
        stock: 18,
        size: '10 аяга',
        material: 'Vanilla/chocolate milkshake option'
      },
      {
        colorName: 'Fruit Smoothie 10ш',
        colorHex: '#D97A64',
        image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=1200&q=80',
        price: 70000,
        stock: 18,
        size: '10 аяга',
        material: 'Berry or mango smoothie option'
      }
    ]
  },
  {
    name: 'Live Band Add-on',
    category: 'Нэмэлт үйлчилгээ',
    description: 'Event-ийн уур амьсгалыг амьд хөгжимтэй болгох хамтлагийн нэмэлт сонголтууд.',
    deliveryInfo: 'Хамтлагийн цаг, сетийн урт, техникийн шаардлагыг захиалгын дараа менежер баталгаажуулна.',
    variants: [
      {
        colorName: 'Dusty Tapes',
        colorHex: '#5A3422',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
        price: 450000,
        stock: 5,
        size: '45-60 минут',
        material: 'Live band performance'
      },
      {
        colorName: 'Bye Ghost',
        colorHex: '#7F9A76',
        image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
        price: 450000,
        stock: 5,
        size: '45-60 минут',
        material: 'Live band performance'
      },
      {
        colorName: 'Witches of Damned',
        colorHex: '#2C1A0E',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
        price: 500000,
        stock: 5,
        size: '45-60 минут',
        material: 'Live band performance'
      }
    ]
  },
  {
    name: 'Projector Add-on',
    category: 'Нэмэлт үйлчилгээ',
    description: 'Presentation, slideshow, video үзүүлэхэд зориулсан projector нэмэлт үйлчилгээ.',
    deliveryInfo: 'Projector ашиглах цаг, дэлгэцийн байрлал, холболтыг event-ийн өмнө баталгаажуулна.',
    variants: [
      {
        colorName: 'Projector',
        colorHex: '#6F5A48',
        image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
        price: 80000,
        stock: 6,
        size: '1 event',
        material: 'Projector rental, HDMI setup'
      }
    ]
  }
];

async function removeDuplicateUsers() {
  const duplicates = await User.aggregate([
    { $group: { _id: '$email', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { _id: { $ne: null }, count: { $gt: 1 } } }
  ]);

  for (const item of duplicates) {
    const [, ...removeIds] = item.ids;
    if (removeIds.length) await User.deleteMany({ _id: { $in: removeIds } });
  }
}

async function removeDuplicateCategories() {
  const duplicates = await Category.aggregate([
    { $group: { _id: '$name', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { _id: { $ne: null }, count: { $gt: 1 } } }
  ]);

  for (const item of duplicates) {
    const [, ...removeIds] = item.ids;
    if (removeIds.length) await Category.deleteMany({ _id: { $in: removeIds } });
  }
}

async function dropLegacyIndexes() {
  const indexes = await Category.collection.indexes();
  if (indexes.some((index) => index.name === 'slug_1')) {
    await Category.collection.dropIndex('slug_1');
  }
}

async function migrateLegacyRoles() {
  await User.updateMany({ role: 'director' }, { role: 'admin' });
  await User.updateMany({ role: 'customer' }, { role: 'user' });
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  await removeDuplicateUsers();
  await removeDuplicateCategories();
  await dropLegacyIndexes();
  await migrateLegacyRoles();

  const name = process.env.SEED_ADMIN_NAME || process.env.SEED_DIRECTOR_NAME || 'Grace Coffee Admin';
  const email = (process.env.SEED_ADMIN_EMAIL || process.env.SEED_DIRECTOR_EMAIL || 'admin@gracecoffee.mn').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || process.env.SEED_DIRECTOR_PASSWORD || 'Director123!';
  const existingAdmin = await User.findOne({ email }).select('+password');

  if (!existingAdmin) {
    await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'admin'
    });
    console.log(`Admin created: ${email}`);
  } else {
    existingAdmin.name = existingAdmin.name || name;
    existingAdmin.role = 'admin';
    existingAdmin.isActive = true;
    if (!existingAdmin.password || !existingAdmin.password.startsWith('$2')) {
      existingAdmin.password = await bcrypt.hash(password, 12);
    }
    await existingAdmin.save();
    console.log(`Admin already exists: ${email}`);
  }

  await Promise.all(
    packageSeeds.map((item) =>
      Package.findOneAndUpdate(
        { code: item.code },
        item,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  const categories = new Map();
  for (const categoryName of categorySeeds) {
    const category = await Category.findOneAndUpdate(
      { name: categoryName },
      { name: categoryName, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();
    categories.set(categoryName, category);
  }

  for (const product of productSeeds) {
    const category = categories.get(product.category);
    const first = product.variants[0];
    await Product.findOneAndUpdate(
      { name: product.name },
      {
        name: product.name,
        price: first.price,
        description: product.description,
        categoryId: category._id,
        image: first.image,
        stock: first.stock,
        deliveryInfo: product.deliveryInfo,
        isFeatured: Boolean(product.isFeatured),
        isActive: true,
        variants: product.variants
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
  }

  await Category.updateMany(
    { name: { $nin: categorySeeds } },
    { isActive: false }
  );

  await Product.updateMany(
    { name: { $nin: productSeeds.map((product) => product.name) } },
    { isActive: false }
  );

  await SiteSettings.findOneAndUpdate(
    { key: 'main' },
    {
      key: 'main',
      bankName: 'Khan Bank',
      bankAccount: '5023456789',
      bankHolder: 'Grace Coffee Shop',
      facebookUrl: 'https://www.facebook.com/gracedarkhan',
      primaryColor: '#2C1A0E',
      accentColor: '#C08B45'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('Grace Coffee database seeded and migrated');
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
