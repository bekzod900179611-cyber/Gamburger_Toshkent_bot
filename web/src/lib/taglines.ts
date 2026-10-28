/** Har bir taom yonidagi kayfiyat ko'taradigan qisqa gap (slug bo'yicha). */
const TAGLINES: Record<string, string> = {
  'klassik-burger': 'Klassika hech qachon eskirmaydi. Ikki qo‘llab ushlang!',
  chizburger: 'Pishlog‘i eriydi — siz ham eriysiz.',
  'double-chizburger': 'Bitta kam edi, shuning uchun ikkita qildik.',
  'gamburger-max': 'Uch qavat. Ogohlantirdik — keyin bizdan xafa bo‘lmang!',
  'bekon-burger': 'Bekon hamma narsani yaxshiroq qiladi. Isbotlangan.',
  'krispi-burger': 'Qarsillashini qo‘shni ham eshitadi.',
  kombo: 'Burger + fri = baxtli tushlik formulasi.',
  'lavash-gosht': 'Yo‘lda ham, ishda ham — bitta qo‘l yetadi.',
  'lavash-tovuq': 'Yengil, mazali va vijdon ham tinch.',
  donar: 'Ziravorlari bilan sizni sayohatga olib ketadi.',
  'hot-dog': 'Uzun sosiska — uzun kayfiyat!',
  fri: 'Bittagina olaman deysiz-u, hammasi tugaydi.',
  'fri-pishloq': 'Oddiy fri charchatdimi? Mana sizga yangi daraja.',
  strips: 'Sousga botiring, ko‘zingizni yuming, rohatlaning.',
  qanotchalar: 'Achchiq! Kolani yoningizda tuting.',
  'piyoz-halqa': 'Piyozni yoqtirmaganlar ham buni yoqtiradi.',
  'coca-cola-1-5': 'Muzdekkina — ovqat ham, kayfiyat ham “ko‘tariladi”.',
  'coca-cola-0-5': 'Burgerning eng yaqin do‘sti. Ularni ajratmang!',
  milkshake: 'Desert va ichimlik — bittasida.',
  suv: 'Oddiy suv, lekin usiz hech qayerga.',
};

export function taglineFor(slug: string): string | undefined {
  return TAGLINES[slug];
}

/** Savatga qo'shilganda chiqadigan quvnoq xabarlar. */
const CHEERS = [
  'Zo‘r tanlov! Savatga tushdi',
  'Didingizga gap yo‘q!',
  'Ishtaha karnay, sousi tayyor!',
  'Oshpazimiz xursand bo‘lib ketdi',
  'Mazza qilasiz, va’da beramiz!',
  'Qorin rahmat aytadi',
];

export function randomCheer(): string {
  return CHEERS[Math.floor(Math.random() * CHEERS.length)];
}
