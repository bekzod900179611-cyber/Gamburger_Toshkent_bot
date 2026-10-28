# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Mijoz (primary):** Toshkentdagi oddiy oila yoki ofis xodimi. Telegram ichida, telefonda, ko'pincha och holda va shoshib ochadi. Vazifasi: milliy taomni (osh, manti, shashlik…) bir necha bosishda tanlab, manzilini kiritib, buyurtma berish.
- **Restoran admini:** Telegram guruhida buyurtmalarni qabul qiladi, holatini tugmalar bilan o'zgartiradi, mijoz lokatsiyasini ko'radi.
- **Restoran egasi (demo tomoshabini):** prototipni ko'rib, sotib olish haqida qaror qiladi.

## Product Purpose

O'zbek milliy taomlari oshxonasi uchun Telegram bot + Mini App orqali yetkazib berish. Muvaffaqiyat: mijoz menyuni ochib, 1 daqiqa ichida buyurtma beradi; restoran egasi demoni ko'rib "shuni olamiz" deydi.

## Positioning

Alohida ilova yuklab olish shart emas — hamma narsa Telegram ichida. Admin buyurtmani guruhda, lokatsiyasi bilan oladi va bir tugma bilan holatni boshqaradi.

## Operating Context

- Mini App Telegram webview ichida, ~375px kenglikdagi telefon ekranida ochiladi.
- Hozircha prototip: sotuvchi uni restoran egalariga ko'rsatadi, sotilgandan keyin mijoz restoran nomi, menyusi va rasmlariga moslanadi.
- Backend: Node/Express/Telegraf, Neon PostgreSQL. Frontend: Next.js (static export) + Tailwind v4 + Zustand.

## Capabilities and Constraints

- Katalog (kategoriyalar: Milliy taomlar, Shashliklar, Salatlar, Ichimliklar), mahsulot oynasi, savatcha, Order Bump, checkout.
- To'lov: Naqd, Telegram Stars ishlaydi; Click/Payme provayder tokeni olingach yoqiladi.
- Admin guruhga buyurtma xabari, holat tugmalari, mijozga holat xabarlari.
- Narxlar faqat serverda hisoblanadi.

## Brand Commitments

- Nom: umumiy — "Milliy Taomlar" (demo uchun; sotilgach mijoz nomiga almashtiriladi).
- Ohang: iliq, mehmondo'st, samimiy; mijozga "siz" deb murojaat; uy ovqati, qozon, tandir, choyxona tasvirlari.
- Til: o'zbek (lotin).
- Vizual yo'nalish (foydalanuvchi tanlovi): kategoriya standarti — zamonaviy yetkazib berish ilovasi, Yandex Eats darajasida bajariladi. Katta, ishtaha ochadigan taom fotolari; issiq ranglar; bir nechta mazmunli animatsiya.

## Evidence on Hand

- Taom rasmlari: tijoriy foydalanish bepul stok rasmlar (Unsplash) — demo uchun; keyin restoranning o'z rasmlari.
- Haqiqiy mijoz sharhlari, buyurtma statistikasi, reyting yo'q — ularni o'ylab topmaslik kerak. "10,000+ mijoz" kabi raqamlar faqat namuna sifatida turibdi va restoran tasdiqlagach almashtiriladi.

## Product Principles

1. Ochlikdan buyurtmagacha — eng qisqa yo'l: har ekranda keyingi qadam aniq.
2. Ishtaha birinchi: taom rasmi va issiq so'z har qanday bezakdan ustun.
3. Telegram ichida mahalliy his: tugmalar, haptic, Orqaga tugmasi Telegram kabi ishlaydi.
4. Ishonch: narx, yetkazish narxi va vaqt doim ochiq ko'rinadi.
