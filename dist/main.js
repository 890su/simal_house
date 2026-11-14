const catalog = 'https://borisovdok.by/storage/docs/June2025/ZJ2F9cX56oCyrsxGApw1.pdf';
const plans = {
  elza: { name: 'Эльза', description: '11,3 м² комнаты и 4,2 м² террасы · 3,8 × 4,8 м', page: 35 },
  diogu: { name: 'Диогу', description: '17,5 м² внутри · 5 × 4 м · терраса по запросу', page: 37 },
  naina: { name: 'Наина', description: '22 м² внутри, из них 2,9 м² под санузел · 5 × 5 м', page: 74 },
};

const packages = {
  kit: {
    label: 'Домокомплект',
    title: 'Заводской домокомплект',
    includes: ['Стены из профилированного бруса', 'Пол, окна и двери по спецификации', 'Конструкция крыши, крепёж и инструкция'],
    note: 'Финишное покрытие кровли, доставка и разгрузка рассчитываются отдельно.',
  },
  build: {
    label: 'Со сборкой',
    title: 'Домик, собранный на участке',
    includes: ['Домокомплект по спецификации', 'Доставка и разгрузка по согласованному адресу', 'Сборка на подготовленном основании', 'Кровельный материал и монтаж покрытия'],
    note: 'Основание, водосток и защиту древесины добавляем по условиям участка.',
  },
  utilities: {
    label: 'С инженерией',
    title: 'Домик с согласованной инженерией',
    includes: ['Комплект, доставка, сборка и финишная кровля', 'Основание и защита дерева по проекту', 'Санузел, электрика, утепление и отделка по выбранной спецификации'],
    note: 'Подключение внешних сетей и оснащение уточняются при расчёте.',
  },
};

const form = document.querySelector('[data-request]');
const packageControl = document.querySelector('[data-packages]');
const planDialog = document.querySelector('#plan-dialog');

function selectField(name, value) {
  const field = form?.elements.namedItem(name);
  if (field) field.value = value;
}

function renderPackage(key) {
  const selection = packages[key];
  const area = packageControl.querySelector('[data-package-content]');
  const heading = document.createElement('h3');
  heading.textContent = selection.title;
  const list = document.createElement('ul');
  list.className = 'check-list';
  for (const line of selection.includes) {
    const item = document.createElement('li');
    item.textContent = line;
    list.append(item);
  }
  const note = document.createElement('p');
  note.textContent = selection.note;
  area.replaceChildren(heading, list, note);
}

if (packageControl) {
  packageControl.addEventListener('change', (event) => renderPackage(event.target.value));
  packageControl.querySelector('[data-use-package]').addEventListener('click', () => {
    selectField('package', packageControl.querySelector('input:checked').value);
  });
}

function openPlan(key) {
  const plan = plans[key];
  planDialog.querySelector('#plan-title').textContent = plan.name;
  planDialog.querySelector('[data-plan-description]').textContent = plan.description;
  const drawing = planDialog.querySelector('[data-plan-image]');
  drawing.src = `assets/${key}-plan.webp`;
  drawing.alt = `Схема модели «${plan.name}» из каталога производителя`;
  planDialog.querySelector('[data-plan-source]').href = `${catalog}#page=${plan.page}`;
  planDialog.querySelector('[data-plan-request]').dataset.model = plan.name;
  planDialog.showModal();
}

for (const button of document.querySelectorAll('button[data-plan]')) {
  button.addEventListener('click', () => openPlan(button.dataset.plan));
}

for (const link of document.querySelectorAll('a[data-model], a[data-plan-request]')) {
  link.addEventListener('click', () => {
    selectField('model', link.dataset.model);
    if (planDialog?.open) planDialog.close();
  });
}

const fieldNames = {
  place: 'Населённый пункт или объект', model: 'Модель', package: 'Комплектация',
  period: 'Желаемый срок', district: 'Район', budget: 'Бюджет (GEL)', quantity: 'Количество домиков',
};
let requestUrl;

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const place = form.elements.namedItem('place');
  if (place && !place.value.trim()) {
    place.setCustomValidity('Укажите населённый пункт.');
    place.reportValidity();
    return;
  }

  const entries = Array.from(new FormData(form), ([key, value]) => [key, value.trim()]);
  const lines = entries.filter(([, value]) => value).map(([key, value]) => {
    const displayValue = key === 'package' ? packages[value].label : value;
    return `${fieldNames[key]} — ${displayValue}`;
  });
  const file = new Blob(['\uFEFF', form.dataset.kind, '\n\n', lines.join('\n'), '\n'], { type: 'text/plain;charset=utf-8' });
  if (requestUrl) URL.revokeObjectURL(requestUrl);
  requestUrl = URL.createObjectURL(file);
  const result = form.querySelector('[data-result]');
  const download = document.createElement('a');
  download.className = 'text-link';
  download.textContent = 'Скачать запрос';
  download.href = requestUrl;
  download.download = 'zapros-dvor-i-dom.txt';
  result.replaceChildren('Запрос подготовлен в браузере.', download);
  result.hidden = false;
});

form?.addEventListener('input', (event) => {
  if (event.target.name === 'place') event.target.setCustomValidity('');
});
