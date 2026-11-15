// Единственное место, где меняются контакты, цены и режим публикации.
// После правок: node build.mjs

export const site = {
  // Адрес сайта без слэша в конце, например 'https://ezo.ge'. Нужен для canonical, hreflang и Open Graph.
  baseUrl: '',
  // false — страницы закрыты от индексации (прототип). Перед запуском поставить true.
  index: false,

  // Контакты. Пустое значение — кнопка ведёт к форме заявки.
  phone: '', // '+995 5XX XX XX XX'
  whatsapp: '', // только цифры: '9955XXXXXXXX'
  telegram: '', // имя пользователя без @
  email: '',

  // Приём заявок. POST JSON на этот адрес (Make, Zapier, n8n, свой сервер, Formspree и т. п.).
  // Пустое значение + заполненный whatsapp — заявка открывается в WhatsApp с готовым текстом.
  // Оба пустые — демо-режим: заявка нигде не сохраняется.
  formEndpoint: '',

  // Цены. Публикуем только подтверждённое.
  priceFrom: 12000, // GEL, домокомплект при самовывозе
  assemblyPct: [15, 20], // сборка на готовом фундаменте с финишной кровлей, % от цены комплекта
  productionMonths: '1,5–2', // срок изготовления при отсутствии на складе, после предоплаты

  // Экспозиция
  showroomOpen: false,
};

// Модели. price: null — «по запросу». Поставьте число в GEL, и калькулятор начнёт считать.
// Площади и упаковка — по каталогу Борисовского ДОКа 2025, стр. в поле page.
export const models = [
  { id: 'elza', w: 3.8, d: 4.8, wall: 44, rooms: [['room', 11.3], ['terrace', 4.2]], packs: 1, packLen: 5, weight: 1723, price: null, page: 35, stock: false },
  { id: 'diogu', w: 5, d: 4, wall: 44, rooms: [['room', 17.5]], packs: 1, packLen: 5.5, weight: 1830, price: null, page: 37, stock: false },
  { id: 'naina', w: 5, d: 5, wall: 44, rooms: [['room', 19.1], ['bath', 2.9]], packs: 2, packLen: 6, weight: 2543, price: null, page: 74, stock: false },
];

// Вариант «Наины» для дома с участком
export const naina66 = { id: 'naina66', w: 6, d: 6, wall: 44, rooms: [['room', 28.6], ['bath', 3.3]], page: 74 };

export const catalogUrl = 'https://borisovdok.by/storage/docs/June2025/ZJ2F9cX56oCyrsxGApw1.pdf';
