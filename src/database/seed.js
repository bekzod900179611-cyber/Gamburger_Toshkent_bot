// Menyuni bazaga yozadi. Qayta ishga tushirilsa — slug bo'yicha yangilaydi, dublikat qilmaydi.
// Rasmlar hozircha Unsplash'dan (pastdagi img()).

import { initDatabase, disconnectDatabase } from './connection.js';
import ProductModel from '../models/Product.js';
import logger from '../utils/logger.js';

// Demo rasmlar: Unsplash (unsplash.com/license — tijoriy foydalanish bepul). Sotilgach restoranning o'z rasmlariga almashtiriladi.
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=75`;

export const MENU = [
  // ---------- BURGERLAR ----------
  {
    slug: 'klassik-burger',
    name: 'Klassik gamburger',
    description: 'Grilda pishgan sersuv mol go‘shti kotleti, yangi sabzavotlar va maxsus sous.',
    ingredients: ['Kunjutli bulochka', 'Mol go‘shti kotleti', 'Pomidor', 'Bodring', 'Aysberg', 'Burger sousi'],
    imageUrl: img('1568901346375-23c9450c58cd'),
    oldPrice: 38000,
    newPrice: 32000,
    category: 'Burgerlar',
    isPopular: true,
    sortOrder: 10,
  },
  {
    slug: 'chizburger',
    name: 'Chizburger',
    description: 'Klassik burger eriydigan chedder pishlog‘i bilan.',
    ingredients: ['Kunjutli bulochka', 'Mol go‘shti kotleti', 'Chedder', 'Pomidor', 'Piyoz', 'Ketchup'],
    imageUrl: img('1571091718767-18b5b1457add'),
    oldPrice: 42000,
    newPrice: 36000,
    category: 'Burgerlar',
    isPopular: true,
    sortOrder: 20,
  },
  {
    slug: 'double-chizburger',
    name: 'Double chizburger',
    description: 'Ikki qavat kotlet va ikki qavat pishloq — katta ishtaha uchun.',
    ingredients: ['Bulochka', '2 ta mol go‘shti kotleti', '2 ta chedder', 'Tuzlangan bodring', 'Gorchitsa'],
    imageUrl: img('1572802419224-296b0aeee0d9'),
    oldPrice: 55000,
    newPrice: 48000,
    category: 'Burgerlar',
    isPopular: true,
    sortOrder: 30,
  },
  {
    slug: 'gamburger-max',
    name: 'Gamburger MAX',
    description: 'Uch qavat kotlet, karamellangan piyoz va pishloq. Faqat jasurlar uchun.',
    ingredients: ['Bulochka', '3 ta mol go‘shti kotleti', 'Chedder', 'Karamel piyoz', 'BBQ sous'],
    imageUrl: img('1553979459-d2229ba7433b'),
    oldPrice: 72000,
    newPrice: 62000,
    category: 'Burgerlar',
    sortOrder: 40,
  },
  {
    slug: 'bekon-burger',
    name: 'Bekon burger',
    description: 'Qarsildoq mol go‘shti bekoni, pishloq va yangi sabzavotlar.',
    ingredients: ['Bulochka', 'Mol go‘shti kotleti', 'Mol go‘shti bekoni', 'Chedder', 'Pomidor', 'Aysberg'],
    imageUrl: img('1586190848861-99aa4a171e90'),
    oldPrice: 52000,
    newPrice: 45000,
    category: 'Burgerlar',
    sortOrder: 50,
  },
  {
    slug: 'krispi-burger',
    name: 'Krispi tovuq burger',
    description: 'Qarsildoq panirovkadagi tovuq filesi, karam salati va achchiq sous.',
    ingredients: ['Bulochka', 'Krispi tovuq filesi', 'Karam salati', 'Achchiq mayonez'],
    imageUrl: img('1606755962773-d324e0a13086'),
    oldPrice: 40000,
    newPrice: 34000,
    category: 'Burgerlar',
    sortOrder: 60,
  },
  {
    slug: 'kombo',
    name: 'Kombo: burger + fri',
    description: 'Klassik gamburger va o‘rtacha kartoshka fri. Tejamkor tushlik.',
    ingredients: ['Klassik gamburger', 'Kartoshka fri', 'Ketchup'],
    imageUrl: img('1594212699903-ec8a3eca50f5'),
    oldPrice: 55000,
    newPrice: 45000,
    category: 'Burgerlar',
    isPopular: true,
    sortOrder: 70,
  },

  // ---------- LAVASH VA HOT-DOG ----------
  {
    slug: 'lavash-gosht',
    name: 'Go‘shtli lavash',
    description: 'Yupqa lavashga o‘ralgan mol go‘shti, fri va sabzavotlar.',
    ingredients: ['Lavash', 'Mol go‘shti', 'Kartoshka fri', 'Pomidor', 'Bodring', 'Sarimsoqli sous'],
    imageUrl: img('1633321702518-7feccafb94d5'),
    oldPrice: 38000,
    newPrice: 32000,
    category: 'Lavash va hot-dog',
    isPopular: true,
    sortOrder: 110,
  },
  {
    slug: 'lavash-tovuq',
    name: 'Tovuqli lavash',
    description: 'Grildagi tovuq go‘shti, karam va yengil sous.',
    ingredients: ['Lavash', 'Tovuq filesi', 'Karam', 'Sabzi', 'Pomidor', 'Oq sous'],
    imageUrl: img('1626700051175-6818013e1d4f'),
    oldPrice: 34000,
    newPrice: 29000,
    category: 'Lavash va hot-dog',
    sortOrder: 120,
  },
  {
    slug: 'donar',
    name: 'Donar',
    description: 'Pita noniga solingan ziravorli go‘sht, piyoz va ko‘katlar.',
    ingredients: ['Pita non', 'Ziravorli go‘sht', 'Qizil piyoz', 'Pomidor', 'Ko‘katlar'],
    imageUrl: img('1529006557810-274b9b2fc783'),
    oldPrice: 36000,
    newPrice: 30000,
    category: 'Lavash va hot-dog',
    sortOrder: 130,
  },
  {
    slug: 'hot-dog',
    name: 'Hot-dog',
    description: 'Uzun bulochkada mol go‘shti sosiskasi, sabzavotlar va souslar.',
    ingredients: ['Bulochka', 'Mol go‘shti sosiskasi', 'Pomidor', 'Tuzlangan bodring', 'Ketchup', 'Gorchitsa'],
    imageUrl: img('1619740455993-9e612b1af08a'),
    oldPrice: 25000,
    newPrice: 20000,
    category: 'Lavash va hot-dog',
    sortOrder: 140,
  },

  // ---------- GAZAKLAR ----------
  {
    slug: 'fri',
    name: 'Kartoshka fri',
    description: 'Tilla rangli, qarsildoq kartoshka fri. Ketchup bilan.',
    ingredients: ['Kartoshka', 'Tuz', 'Ketchup'],
    imageUrl: img('1630384060421-cb20d0e0649d'),
    oldPrice: 18000,
    newPrice: 15000,
    category: 'Gazaklar',
    isBump: true,
    sortOrder: 210,
  },
  {
    slug: 'fri-pishloq',
    name: 'Fri pishloq va sarimsoq bilan',
    description: 'Parmezan, sarimsoq va ko‘katlar sepilgan fri.',
    ingredients: ['Kartoshka fri', 'Parmezan', 'Sarimsoq', 'Ukrop'],
    imageUrl: img('1573080496219-bb080dd4f877'),
    oldPrice: 25000,
    newPrice: 21000,
    category: 'Gazaklar',
    sortOrder: 220,
  },
  {
    slug: 'strips',
    name: 'Tovuq strips (6 dona)',
    description: 'Qarsildoq panirovkadagi tovuq bo‘laklari, sous bilan.',
    ingredients: ['Tovuq filesi', 'Panirovka', 'Sarimsoqli sous'],
    imageUrl: img('1562967914-608f82629710'),
    oldPrice: 35000,
    newPrice: 29000,
    category: 'Gazaklar',
    sortOrder: 230,
  },
  {
    slug: 'qanotchalar',
    name: 'Achchiq qanotchalar (8 dona)',
    description: 'Achchiq-shirin sousga botirilgan qarsildoq tovuq qanotchalari.',
    ingredients: ['Tovuq qanotlari', 'Achchiq sous', 'Asal', 'Sarimsoq'],
    imageUrl: img('1608039755401-742074f0548d'),
    oldPrice: 45000,
    newPrice: 38000,
    category: 'Gazaklar',
    sortOrder: 240,
  },
  {
    slug: 'piyoz-halqa',
    name: 'Piyoz halqalari',
    description: 'Qarsildoq xamirga o‘ralgan piyoz halqalari.',
    ingredients: ['Piyoz', 'Suyuq xamir', 'BBQ sous'],
    imageUrl: img('1639024471283-03518883512d'),
    oldPrice: 22000,
    newPrice: 18000,
    category: 'Gazaklar',
    sortOrder: 250,
  },

  // ---------- ICHIMLIKLAR ----------
  {
    slug: 'coca-cola-1-5',
    name: 'Coca-Cola 1.5L',
    description: 'Muzdek Coca-Cola. Butun oila uchun.',
    ingredients: ['Gazlangan ichimlik', '1.5 litr'],
    imageUrl: img('1648569883125-d01072540b4c'),
    oldPrice: 18000,
    newPrice: 15000,
    category: 'Ichimliklar',
    isBump: true,
    sortOrder: 310,
  },
  {
    slug: 'coca-cola-0-5',
    name: 'Coca-Cola 0.5L',
    description: 'Burger bilan eng mos juftlik.',
    ingredients: ['Gazlangan ichimlik', '0.5 litr'],
    imageUrl: img('1554866585-cd94860890b7'),
    oldPrice: 0,
    newPrice: 9000,
    category: 'Ichimliklar',
    sortOrder: 320,
  },
  {
    slug: 'milkshake',
    name: 'Milkshake Oreo',
    description: 'Vanilli muzqaymoq va Oreo pechenyesidan quyuq kokteyl.',
    ingredients: ['Sut', 'Vanilli muzqaymoq', 'Oreo', 'Shokolad siropi'],
    imageUrl: img('1572490122747-3968b75cc699'),
    oldPrice: 28000,
    newPrice: 24000,
    category: 'Ichimliklar',
    sortOrder: 330,
  },
  {
    slug: 'suv',
    name: 'Mineral suv 0.5L',
    description: 'Gazsiz mineral suv.',
    ingredients: ['0.5 litr'],
    imageUrl: img('1616118132534-381148898bb4'),
    oldPrice: 0,
    newPrice: 4000,
    category: 'Ichimliklar',
    sortOrder: 340,
  },
];

async function seed() {
  await initDatabase();

  for (const product of MENU) {
    await ProductModel.upsert(product);
    logger.info(`Menyu: ${product.name}`);
  }

  logger.info(`Seed tugadi. Bazadagi mahsulotlar soni: ${await ProductModel.count()}`);
}

seed()
  .catch((error) => {
    logger.error('Seed xatosi', error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
