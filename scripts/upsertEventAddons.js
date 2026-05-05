require('dotenv').config();

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const products = [
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

async function upsertProduct(product) {
  const category = await Category.findOneAndUpdate(
    { name: product.category },
    { name: product.category, isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
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
      isFeatured: true,
      isActive: true,
      variants: product.variants
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const product of products) {
    await upsertProduct(product);
  }
  await mongoose.disconnect();
  console.log('Event add-on products upserted');
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
