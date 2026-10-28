---
version: 1
slug: "web-src-app-page-tsx"
primary_target: "web/src/app/page.tsx"
related_targets: []
---

# Mini App — mijoz oynasi

Scope: web/src/app/page.tsx (Bosh sahifa, Katalog, Savatcha, Profil, mahsulot oynasi, checkout). Mode: operate.

Audience/job: och mijoz Telegram ichida telefonda 1 daqiqada milliy taom buyurtma qiladi. Demo tomoshabini — restoran egasi.

Constraints: Telegram webview ~375px; real narxlar serverdan; stok fotolar (Unsplash) demo uchun, keyin restoran rasmlari; o'ylab topilgan sharh/reyting yo'q.

## Direction contract

THESIS: Kategoriya standarti, Yandex Eats darajasida: taom fotosi qaror qiladi. Rad etiladi: emoji-bezak, kulrang kartochkalar devori, kicker yozuvlar.

OWN-WORLD: Iliq oq-krem fon (#fffaf3), ko'mir matn (#1c1410), bitta harakat rangi — qovurilgan qalampir qizili (#e2471d) faqat bosiladigan joyda; zafaron (#f2a23a) faqat chegirma/aksiya belgilari. Katta 20px burchakli to'liq-qon fotolar, chiziqli (stroke 2) SVG ikonlar, Manrope.

STORY: Mijoz salomni va bugungi "issiq" taomni ko'radi, bir bosishda qo'shadi, savatda bepul yetkazishgacha qolgan summani ko'radi, manzilni lokatsiya bilan to'ldiradi, buyurtma tasdiqlanganini his qiladi.

FIRST VIEWPORT: Tepada salom + manzil qatori; ostida stories qatori (fotoli doiralar); keyin ekranning ~45% balandligidagi to'liq fotoli "Bugun qozondan" hero kartasi — taom nomi, narx, katta "Savatga" tugmasi; pastda mashhur taomlar gorizontal tasmasi. Pastki navigatsiya doim ko'rinadi.

FORM: kategoriya standarti (canon), seed aa7ccc99. Signature move: "savatga uchish" — qo'shilgan taom fotosi kichrayib pastki savat ikonkasiga uchadi, savat ikonkasi silkinib son ortadi.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
