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

const categorySeeds = ['Event багц', 'Кофе сет', 'Амттан', 'Чимэглэл', 'Нэмэлт үйлчилгээ'];

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
    isFeatured: false,
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
    isFeatured: false,
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
  }
];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const name = process.env.SEED_DIRECTOR_NAME || 'Grace Coffee Admin';
  const email = (process.env.SEED_DIRECTOR_EMAIL || 'admin@gracecoffee.mn').toLowerCase();
  const password = process.env.SEED_DIRECTOR_PASSWORD || 'Director123!';
  const existingDirector = await User.findOne({ email }).lean();

  if (!existingDirector) {
    await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'director'
    });
    console.log(`Director created: ${email}`);
  } else {
    console.log(`Director already exists: ${email}`);
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
  console.log('Packages seeded');

  await Promise.all(
    categorySeeds.map((categoryName) =>
      Category.findOneAndUpdate(
        { slug: slugify(categoryName) },
        { name: categoryName, slug: slugify(categoryName), isActive: true },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      )
    )
  );

  await Promise.all(
    productSeeds.map((product) =>
      Product.findOneAndUpdate(
        { name: product.name },
        { ...product, isActive: true },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      )
    )
  );

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
      facebookUrl: 'https://facebook.com/',
      primaryColor: '#2C1A0E',
      accentColor: '#C08B45'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Grace Coffee event products seeded');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
