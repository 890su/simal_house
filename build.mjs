import { mkdir, writeFile } from 'node:fs/promises';
import { copy } from './copy.mjs';

const dist = new URL('./dist/', import.meta.url);
const catalog = 'https://borisovdok.by/storage/docs/June2025/ZJ2F9cX56oCyrsxGApw1.pdf';
const pages = { garden: '', property: 'property.html', business: 'hospitality.html' };
const models = [
  { id: 'elza', area: 11.3, size: '3.8 × 4.8', page: 35 },
  { id: 'diogu', area: 17.5, size: '5 × 4', page: 37 },
  { id: 'naina', area: 22, size: '5 × 5', page: 74 },
];
const arrow = '<svg aria-hidden="true" viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 15 15 4M6 4h9v9"/></svg>';
const down = '<svg aria-hidden="true" viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 3v13m-5-5 5 5 5-5"/></svg>';
const logomark = '<svg aria-hidden="true" viewBox="0 0 37 38" width="36" height="36" stroke="currentColor" stroke-width="1.55" fill="none"><path d="M3 17 18.5 4 34 17M7 15v18h23V15M7 21h23M7 27h23M23 33V21"/></svg>';
const langName = { ka: 'ქართული', ru: 'Русский', en: 'English' };
const langShort = { ka: 'ქარ', ru: 'RU', en: 'EN' };

function href(lang, page) {
  return `${lang === 'ka' ? '' : `${lang}/`}${pages[page]}` || './';
}

function scene(asset, id, alt, { priority = false, sizes = '(max-width: 720px) 100vw, 66vw' } = {}) {
  return `<img src="${asset}${id}-scene.webp" srcset="${asset}${id}-scene-small.webp 760w, ${asset}${id}-scene.webp 1500w" sizes="${sizes}" alt="${alt}" width="1500" height="1000" ${priority ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
}

function urls(current) {
  return (language, page) => {
    const root = current === 'ka' ? '' : '../';
    const link = href(language, page);
    return link === './' ? root || './' : `${root}${link}`;
  };
}

function faqSection(t) {
  return `<section class="faq shell section" id="faq"><h2>${t.faq}</h2><div>${t.questions.map(([question, answer]) => `<details><summary>${question}<span class="cross" aria-hidden="true"></span></summary><p>${answer}</p></details>`).join('')}</div></section>`;
}

function requestForm(c, t, page) {
  const select = (name, options) => `<select name="${name}">${options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select>`;
  const field = (name, html) => `<label><span>${c.fields[name]}</span>${html}</label>`;
  const place = field('place', '<input name="place" required maxlength="100" aria-describedby="place-error"><small id="place-error" class="field-error" hidden></small>');
  const period = field('period', '<input name="period" maxlength="60">');
  const fields = {
    garden: [place, field('model', select('model', [['', c.option], ...models.map((model, i) => [model.id, c.names[i]])])), field('package', select('package', c.packages.map(([label], i) => [i, label]))), period],
    property: [field('district', select('district', c.districts.map((text, i) => [i, text]))), field('budget', '<input name="budget" inputmode="numeric" maxlength="15">')],
    business: [place, field('quantity', select('quantity', c.quantities.map((text, i) => [i, text]))), period],
  };
  return `<section class="request section" id="request"><div class="shell request-layout"><div><h2>${t.formTitle}</h2><p>${t.formLead}</p></div><form data-request data-required="${c.required}" data-ready="${c.ready}" data-download="${c.download}" data-title="${t.formTitle}"><div class="fields">${fields[page].join('')}</div><button class="button" type="submit">${c.submit}${arrow}</button><p class="form-note">${c.note}</p><p aria-live="polite" class="result" data-result hidden></p></form></div></section>`;
}

function gallery(c, t, asset, lang) {
  const number = new Intl.NumberFormat(lang);
  const panels = models.map((model, i) => {
    const label = `${c.names[i]} · ${number.format(model.area)} ${c.unit}`;
    const size = lang === 'en' ? model.size : model.size.replaceAll('.', ',');
    return `<section class="gallery-panel" id="cabin-${model.id}" data-panel="${model.id}" aria-labelledby="name-${model.id}">
      <figure>${scene(asset, model.id, label)}<figcaption>${c.render}</figcaption></figure>
      <div class="model-detail"><div><h3 id="name-${model.id}">${c.names[i]}</h3><p>${c.modelText[i]}</p></div><dl class="specs"><div><dt>${c.inside}</dt><dd>${number.format(model.area)} ${c.unit}</dd></div><div><dt>${c.size}</dt><dd>${size} ${c.metre}</dd></div></dl>
      <div class="model-actions"><button type="button" class="outline" data-plan="${model.id}">${c.plan}</button><a class="button" href="#request" data-model="${model.id}">${c.modelQuote}${arrow}</a></div></div>
      <template id="plan-${model.id}"><h2 id="plan-title">${c.names[i]}</h2><figure><img src="${asset}${model.id}-plan.webp" alt="${c.names[i]} · ${c.planSource}"><figcaption>${c.planSource}</figcaption></figure><a class="text-link" href="${catalog}#page=${model.page}" target="_blank" rel="noopener">${c.source}${arrow}</a></template>
    </section>`;
  });
  return `<section id="models" class="gallery shell section" data-gallery><div class="section-head"><h2>${t.heading}</h2><p>${t.gallery}</p></div>
  <div class="gallery-nav">${models.map((m, i) => `<a class="gallery-link" href="#cabin-${m.id}" data-show="${m.id}"><span>${c.names[i]}</span><span>${number.format(m.area)} ${c.unit}${arrow}</span></a>`).join('')}</div>
  <div class="gallery-panels">${panels.join('')}</div></section>`;
}

function packagesSection(c, t) {
  return `<section class="package section" id="packages"><div class="shell package-layout"><div><h2>${t.estimate}</h2><p>${t.estimateLead}</p></div><div class="packages" data-package-list>
  ${c.packages.map(([label, heading, lines, note], i) => `<details ${i === 0 ? 'open' : ''} name="estimate"><summary>${label}<span class="cross" aria-hidden="true"></span></summary><div class="package-body"><h3>${heading}</h3><ul>${lines.map((line) => `<li>${line}</li>`).join('')}</ul><p>${note}</p><a href="#request" data-package="${i}" class="text-link">${c.packageUse}${arrow}</a></div></details>`).join('')}</div></div></section>`;
}

function projectSection(c, t, page, asset, lang) {
  const property = page === 'property';
  const area = new Intl.NumberFormat(lang).format(property ? 31.9 : 22);
  return `<section class="shell section project" id="project"><div class="project-copy"><h2>${t.heading}</h2><p>${t.detail}</p><dl class="specs"><div><dt>${c.inside}</dt><dd>${area} ${c.unit}</dd></div><div><dt>${c.size}</dt><dd>${property ? '6 × 6' : '5 × 5'} ${c.metre}</dd></div></dl><a class="text-link" href="${catalog}#page=74" rel="noopener" target="_blank">${c.source}${arrow}</a></div>
  <figure class="project-plan"><img loading="lazy" src="${asset}naina-plan.webp" alt="${c.names[2]} · ${c.planSource}" width="244" height="234"><figcaption>${c.planSource}</figcaption></figure></section>
  <section class="scope section"><div class="shell scope-layout"><h2>${t.scope}</h2><dl>${t.items.map(([title, detail]) => `<div><dt>${title}</dt><dd>${detail}</dd></div>`).join('')}</dl></div></section>`;
}

function render(lang, page) {
  const c = copy[lang];
  const t = c[page];
  const link = urls(lang);
  const asset = lang === 'ka' ? 'assets/' : '../assets/';
  const local = lang === 'ka' ? '' : '../';
  const activeImage = { garden: 'elza', property: 'naina-land', business: 'naina' }[page];
  const browserTitle = `${t.headline.join(' ')} · ${c.brand}`;
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="${t.lead}">
  <title>${browserTitle}</title>
  <link rel="icon" href="${asset}mark.svg" type="image/svg+xml">
  ${Object.keys(copy).map((language) => `<link rel="alternate" hreflang="${language}" href="${link(language, page)}">`).join('\n  ')}
  <link rel="alternate" hreflang="x-default" href="${link('ka', page)}">
  <link rel="stylesheet" href="${local}styles.css">
  <script defer src="${local}main.js"></script>
</head>
<body class="${page}">
  <a class="skip" href="#main">${c.skip}</a>
  <header class="header"><div class="shell header-inner">
    <a class="brand" href="${link(lang, 'garden')}">${logomark}<span>${c.brand}</span></a>
    <nav class="nav" aria-label="${c.navigation}">${Object.keys(pages).map((key, i) => `<a href="${link(lang, key)}"${page === key ? ' aria-current="page"' : ''}>${c.route[i]}</a>`).join('')}</nav>
    <nav class="langs" aria-label="${c.language}">${Object.keys(copy).map((language) => `<a href="${link(language, page)}" lang="${language}" aria-label="${langName[language]}"${language === lang ? ' aria-current="page"' : ''}>${langShort[language]}</a>`).join('')}</nav>
  </div></header>
  <main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <figure class="hero-image">${scene(asset, activeImage, `${c.names[page === 'garden' ? 0 : 2]} · ${c.render}`, { priority: true, sizes: '100vw' })}<figcaption>${c.render}</figcaption></figure>
      <div class="shell hero-content"><h1 id="hero-title">${t.headline.map((line) => `<span>${line}</span>`).join(' ')}</h1>${t.stage ? `<p class="stage">${t.stage}</p>` : ''}<p class="hero-lead">${t.lead}</p><div class="hero-actions"><a class="button" href="#request">${t.cta}${arrow}</a><a class="hero-link" href="#${page === 'garden' ? 'models' : 'project'}">${t.second}${down}</a></div></div>
    </section>
    ${page === 'garden' ? gallery(c, t, asset, lang) + packagesSection(c, t) : projectSection(c, t, page, asset, lang)}
    ${faqSection(t)}
    ${requestForm(c, t, page)}
  </main>
  <footer class="footer"><div class="shell"><a class="brand" href="${link(lang, 'garden')}">${logomark}<span>${c.brand}</span></a><a class="text-link" href="https://borisovdok.by/documents" rel="noopener" target="_blank">${c.source}${arrow}</a></div></footer>
  ${page === 'garden' ? `<dialog id="plan-dialog" aria-labelledby="plan-title"><div class="dialog-head"><form method="dialog"><button class="outline" type="submit">${c.close}</button></form></div><div data-plan-body></div><a class="button" data-model href="#request">${c.modelQuote}${arrow}</a></dialog>` : ''}
</body>
</html>\n`;
}

for (const lang of Object.keys(copy)) {
  const folder = lang === 'ka' ? dist : new URL(`${lang}/`, dist);
  await mkdir(folder, { recursive: true });
  await Promise.all(Object.keys(pages).map((page) => writeFile(new URL(pages[page] || 'index.html', folder), render(lang, page))));
}
